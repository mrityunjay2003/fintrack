import uuid
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import Transaction, Account, Category
from app.schemas.finance import KPIsResponse, CategorySpend, TrendPoint, Insight, ReconciliationResponse

# --- Base Filters ---
def get_base_filters(from_date: Optional[date] = None, to_date: Optional[date] = None):
    filters = [Transaction.deleted_at.is_(None), Transaction.is_transfer == False, Transaction.type != 'transfer']
    if from_date:
        filters.append(Transaction.date >= from_date)
    if to_date:
        filters.append(Transaction.date <= to_date)
    return filters

# --- KPIs (Income, Expense, Net, Savings Rate) ---
async def get_kpis(db: AsyncSession, from_date: Optional[date], to_date: Optional[date]) -> KPIsResponse:
    filters = get_base_filters(from_date, to_date)
    
    # We group by type to get sum of income and sum of expenses
    query = select(Transaction.type, func.sum(Transaction.amount)).where(and_(*filters)).group_by(Transaction.type)
    res = await db.execute(query)
    
    income = 0
    expense = 0
    for txn_type, total in res.all():
        if txn_type == 'income':
            income = total or 0
        elif txn_type == 'expense':
            expense = total or 0
            
    net = income + expense # Expense is already negative
    savings_rate = 0.0
    if income > 0:
        savings_rate = round((net / income) * 100, 1)
        
    return KPIsResponse(income=income, expense=expense, net=net, savings_rate=savings_rate)

# --- Accounts Overview (with dynamic balances and month % change) ---
async def get_dashboard_accounts(db: AsyncSession) -> List[Account]:
    accounts_res = await db.execute(select(Account).where(Account.deleted_at.is_(None)))
    accounts = accounts_res.scalars().all()
    
    today = date.today()
    start_of_month = today.replace(day=1)
    
    for acc in accounts:
        # Calculate total balance (including transfers here, because it's actual cash balance)
        bal_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id == acc.id, Transaction.deleted_at.is_(None)
        )
        total_change = (await db.execute(bal_query)).scalar() or 0
        acc.balance = acc.opening_balance + total_change
        
        # Calculate this month's change to determine percentage
        month_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id == acc.id,
            Transaction.date >= start_of_month,
            Transaction.deleted_at.is_(None)
        )
        month_change = (await db.execute(month_query)).scalar() or 0
        
        # Simple % change heuristic against the start-of-month balance
        start_bal = acc.balance - month_change
        acc.month_change_percent = round((month_change / start_bal) * 100, 1) if start_bal != 0 else 0.0
        
    return accounts

# --- Category Spend (Donut Chart) ---
async def get_category_spend(db: AsyncSession, from_date: Optional[date], to_date: Optional[date]) -> List[CategorySpend]:
    filters = get_base_filters(from_date, to_date)
    filters.append(Transaction.type == 'expense')
    
    query = (
        select(Category.name, Category.color, Category.id, func.sum(Transaction.amount).label("total"))
        .join(Category, Transaction.category_id == Category.id)
        .where(and_(*filters))
        .group_by(Category.id)
        .order_by(func.sum(Transaction.amount).asc()) # Ascending because expenses are negative
    )
    
    res = await db.execute(query)
    spend_data = []
    
    for name, color, cat_id, total in res.all():
        spend_data.append(CategorySpend(
            name=name,
            value=abs(total), # Frontend charts expect positive magnitudes
            color_hex=color or "#cbd5e1",
            category_id=cat_id
        ))
    return spend_data

# --- Spending Trend (Line/Area Chart) ---
async def get_spending_trend(db: AsyncSession, from_date: Optional[date], to_date: Optional[date]) -> List[TrendPoint]:
    filters = get_base_filters(from_date, to_date)
    filters.append(Transaction.type == 'expense')
    
    # SQLite specific: strftime to group by Week (%W) or Month (%m). 
    # For a general view, grouping by exact date or week is fine. Let's do exact date aggregated for standard charts.
    query = (
        select(Transaction.date, func.sum(Transaction.amount))
        .where(and_(*filters))
        .group_by(Transaction.date)
        .order_by(Transaction.date.asc())
    )
    
    res = await db.execute(query)
    trend = []
    for txn_date, total in res.all():
        trend.append(TrendPoint(date=txn_date.strftime("%b %d"), amount=abs(total)))
    return trend

# --- Reconciliation ---
async def get_reconciliation(db: AsyncSession, account_id: uuid.UUID) -> ReconciliationResponse:
    account = await db.get(Account, account_id)
    if not account:
        raise ValueError("Account not found")

    # Find the latest transaction that was imported and has a statement_balance
    latest_import_query = (
        select(Transaction)
        .where(Transaction.account_id == account_id, Transaction.statement_balance.is_not(None))
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .limit(1)
    )
    latest_import = (await db.execute(latest_import_query)).scalar_one_or_none()

    if not latest_import:
        return ReconciliationResponse(
            account_id=account_id, latest_txn_date=None, statement_balance=None, 
            computed_balance=None, is_reconciled=True, difference=0
        )

    # Compute running balance strictly up to that exact transaction
    running_sum_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id == account_id,
        Transaction.deleted_at.is_(None),
        Transaction.date <= latest_import.date
    )
    running_sum = (await db.execute(running_sum_query)).scalar() or 0
    computed_bal = account.opening_balance + running_sum

    diff = computed_bal - latest_import.statement_balance
    
    return ReconciliationResponse(
        account_id=account_id,
        latest_txn_date=latest_import.date,
        statement_balance=latest_import.statement_balance,
        computed_balance=computed_bal,
        is_reconciled=(diff == 0),
        difference=diff
    )

# --- Basic Insights Generator ---
async def generate_insights(db: AsyncSession, from_date: Optional[date], to_date: Optional[date]) -> List[Insight]:
    # This acts as a foundation. In a production app, you expand these heuristics.
    insights = []
    
    # Example Insight 1: Check if total expenses this period are unusually high
    kpis = await get_kpis(db, from_date, to_date)
    if kpis.net < 0:
        insights.append(Insight(
            type="warning",
            title="Negative Cashflow",
            detail="You have spent more than you earned in this period.",
            severity=2
        ))
    elif kpis.savings_rate > 30:
        insights.append(Insight(
            type="success",
            title="Great Savings Rate",
            detail=f"You saved {kpis.savings_rate}% of your income this period!",
            severity=1
        ))

    return insights
import uuid
import calendar
from datetime import date
from typing import List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models.finance import Budget, Transaction
from app.schemas.finance import BudgetCreate, BudgetUpdate

async def get_budgets_for_month(db: AsyncSession, month_str: str) -> List[Budget]:
    """
    Fetches budgets for a YYYY-MM month, dynamically computing 'spent' 
    from the transactions in that same month.
    """
    # 1. Parse month string to get exact date boundaries
    try:
        year, month = map(int, month_str.split("-"))
        start_date = date(year, month, 1)
        end_date = date(year, month, calendar.monthrange(year, month)[1])
    except ValueError:
        return []

    # 2. Subquery to calculate total spent per category for this specific month
    # We use abs() because expenses are stored as negative numbers
    spent_subq = (
        select(
            Transaction.category_id,
            func.coalesce(func.abs(func.sum(Transaction.amount)), 0).label("spent")
        )
        .where(
            Transaction.date >= start_date,
            Transaction.date <= end_date,
            Transaction.deleted_at.is_(None),
            Transaction.is_transfer == False,
            Transaction.type == 'expense'
        )
        .group_by(Transaction.category_id)
        .subquery()
    )

    # 3. Main query joining budgets with the computed spent subquery
    query = (
        select(Budget, spent_subq.c.spent)
        .outerjoin(spent_subq, Budget.category_id == spent_subq.c.category_id)
        .options(selectinload(Budget.category))
        .where(Budget.month == month_str)
    )

    result = await db.execute(query)
    
    # 4. Attach computed spent to the budget model instances for Pydantic serialization
    budgets = []
    for budget, spent in result.all():
        budget.spent = spent or 0
        budgets.append(budget)
        
    return budgets

async def create_budget(db: AsyncSession, obj_in: BudgetCreate) -> Budget:
    db_obj = Budget(**obj_in.model_dump())
    db.add(db_obj)
    try:
        await db.commit()
        await db.refresh(db_obj)
    except IntegrityError:
        await db.rollback()
        raise ValueError("Budget for this category and month already exists.")
    
    # Load category relation for the response
    await db.refresh(db_obj, ["category"])
    return db_obj

async def update_budget(db: AsyncSession, budget_id: uuid.UUID, obj_in: BudgetUpdate) -> Optional[Budget]:
    db_obj = await db.get(Budget, budget_id)
    if not db_obj:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_budget(db: AsyncSession, budget_id: uuid.UUID) -> bool:
    db_obj = await db.get(Budget, budget_id)
    if not db_obj:
        return False
    await db.delete(db_obj)
    await db.commit()
    return True

async def copy_budgets(db: AsyncSession, from_month: str, to_month: str) -> int:
    """Copies all budgets from one month to another, skipping existing ones."""
    source_budgets = (await db.execute(select(Budget).where(Budget.month == from_month))).scalars().all()
    if not source_budgets:
        return 0

    existing_targets = (await db.execute(select(Budget.category_id).where(Budget.month == to_month))).scalars().all()
    existing_set = set(existing_targets)

    copied_count = 0
    for b in source_budgets:
        if b.category_id not in existing_set:
            new_budget = Budget(
                category_id=b.category_id,
                month=to_month,
                limit_amount=b.limit_amount
            )
            db.add(new_budget)
            copied_count += 1
            
    if copied_count > 0:
        await db.commit()
        
    return copied_count
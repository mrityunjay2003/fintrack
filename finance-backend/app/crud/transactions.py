import uuid
import hashlib
from datetime import date, datetime, UTC
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import Transaction, Account, Rule
from app.schemas.finance import TransactionCreate, TransactionUpdate, TransactionBulkUpdate
from app.services.categorization import apply_rules_to_single_transaction

def generate_dedup_hash(account_id: uuid.UUID, txn_date: date, amount: int, raw_details: str) -> str:
    normalized_raw = " ".join(raw_details.split()).strip().lower()
    s = f"{account_id}|{txn_date.isoformat()}|{amount}|{normalized_raw}"
    return hashlib.sha256(s.encode()).hexdigest()

async def get_transactions(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    account_id: Optional[uuid.UUID] = None,
    category_id: Optional[uuid.UUID] = None,
    type_: Optional[str] = None,
    min_amount: Optional[int] = None,
    max_amount: Optional[int] = None
) -> Tuple[List[Transaction], int]:
    
    # 1. Base Query setup
    query = select(Transaction, Account.opening_balance).join(Account).where(Transaction.deleted_at.is_(None))
    
    if search:
        search_term = f"%{search}%"
        query = query.where(or_(Transaction.label.ilike(search_term), Transaction.raw_details.ilike(search_term)))
    if from_date:
        query = query.where(Transaction.date >= from_date)
    if to_date:
        query = query.where(Transaction.date <= to_date)
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if type_:
        query = query.where(Transaction.type == type_)
    if min_amount is not None:
        query = query.where(func.abs(Transaction.amount) >= min_amount)
    if max_amount is not None:
        query = query.where(func.abs(Transaction.amount) <= max_amount)

    # 2. Get Total Count
    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0

    # 3. Subquery for running sum (sum of all prior transactions for the same account)
    T_alias = aliased(Transaction)
    running_sum_subq = (
        select(func.coalesce(func.sum(T_alias.amount), 0))
        .where(
            T_alias.account_id == Transaction.account_id,
            T_alias.deleted_at.is_(None),
            or_(
                T_alias.date < Transaction.date,
                and_(T_alias.date == Transaction.date, T_alias.created_at <= Transaction.created_at)
            )
        )
        .scalar_subquery()
        .correlate(Transaction)
    )

    # 4. Fetch Paginated Results
    query = query.add_columns(running_sum_subq)
    query = query.options(selectinload(Transaction.category), selectinload(Transaction.account))
    query = query.order_by(desc(Transaction.date), desc(Transaction.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)

    results = await db.execute(query)
    
    # Assemble the final objects by injecting the computed running balance
    transactions = []
    for txn, opening_bal, running_sum in results:
        txn.running_balance = opening_bal + running_sum
        transactions.append(txn)

    return transactions, total_count

async def create_transaction(db: AsyncSession, obj_in: TransactionCreate) -> Transaction:
    db_obj = Transaction(**obj_in.model_dump(exclude_unset=True))
    db_obj.source = "manual"
    db_obj.dedup_hash = generate_dedup_hash(db_obj.account_id, db_obj.date, db_obj.amount, db_obj.raw_details or db_obj.label)
    
    # Run through the categorization engine
    if not db_obj.category_id:
        await apply_rules_to_single_transaction(db, db_obj)
        
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_transaction(db: AsyncSession, txn_id: uuid.UUID, obj_in: TransactionUpdate) -> Optional[Transaction]:
    db_obj = await db.get(Transaction, txn_id)
    if not db_obj or db_obj.deleted_at:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def bulk_update_transactions(db: AsyncSession, obj_in: TransactionBulkUpdate) -> int:
    query = select(Transaction).where(Transaction.id.in_(obj_in.ids), Transaction.deleted_at.is_(None))
    txns = (await db.execute(query)).scalars().all()
    
    count = 0
    for txn in txns:
        if obj_in.category_id is not None:
            txn.category_id = obj_in.category_id
        if obj_in.is_transfer is not None:
            txn.is_transfer = obj_in.is_transfer
        count += 1
        
    # Optionally create a rule
    if obj_in.create_rule_keyword and obj_in.category_id:
        new_rule = Rule(
            match_field="label",
            pattern=obj_in.create_rule_keyword,
            category_id=obj_in.category_id,
            priority=10
        )
        db.add(new_rule)
        
    await db.commit()
    return count

async def delete_transaction(db: AsyncSession, txn_id: uuid.UUID) -> bool:
    db_obj = await db.get(Transaction, txn_id)
    if not db_obj or db_obj.deleted_at:
        return False
    db_obj.deleted_at = datetime.now(UTC) # Soft Delete
    await db.commit()
    return True
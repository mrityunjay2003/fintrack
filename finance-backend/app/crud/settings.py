import uuid
from datetime import datetime, UTC
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import Account, Category, Rule
from app.schemas.finance import (
    AccountCreate, AccountUpdate, 
    CategoryCreate, CategoryUpdate, 
    RuleCreate, RuleUpdate
)

# --- Accounts ---
async def get_accounts(db: AsyncSession) -> List[Account]:
    res = await db.execute(select(Account).where(Account.deleted_at.is_(None)))
    return res.scalars().all()

async def create_account(db: AsyncSession, obj_in: AccountCreate) -> Account:
    db_obj = Account(**obj_in.model_dump())
    db_obj.mask = str(uuid.uuid4())[:4] # Generate a dummy mask
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_account(db: AsyncSession, account_id: uuid.UUID, obj_in: AccountUpdate) -> Optional[Account]:
    db_obj = await db.get(Account, account_id)
    if not db_obj or db_obj.deleted_at:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_account(db: AsyncSession, account_id: uuid.UUID) -> bool:
    db_obj = await db.get(Account, account_id)
    if not db_obj or db_obj.deleted_at:
        return False
    db_obj.deleted_at = datetime.now(UTC) # Soft Delete
    await db.commit()
    return True

# --- Categories ---
async def get_categories(db: AsyncSession) -> List[Category]:
    res = await db.execute(select(Category).order_by(Category.sort_order, Category.name))
    return res.scalars().all()

async def create_category(db: AsyncSession, obj_in: CategoryCreate) -> Category:
    db_obj = Category(**obj_in.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_category(db: AsyncSession, category_id: uuid.UUID, obj_in: CategoryUpdate) -> Optional[Category]:
    db_obj = await db.get(Category, category_id)
    if not db_obj:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> bool:
    db_obj = await db.get(Category, category_id)
    if not db_obj:
        return False
    await db.delete(db_obj)
    await db.commit()
    return True

# --- Rules ---
async def get_rules(db: AsyncSession) -> List[Rule]:
    # We use selectinload so Pydantic can serialize the joined Category
    res = await db.execute(
        select(Rule).options(selectinload(Rule.category)).order_by(Rule.priority)
    )
    return res.scalars().all()

async def create_rule(db: AsyncSession, obj_in: RuleCreate) -> Rule:
    db_obj = Rule(**obj_in.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_rule(db: AsyncSession, rule_id: uuid.UUID, obj_in: RuleUpdate) -> Optional[Rule]:
    db_obj = await db.get(Rule, rule_id)
    if not db_obj:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_rule(db: AsyncSession, rule_id: uuid.UUID) -> bool:
    db_obj = await db.get(Rule, rule_id)
    if not db_obj:
        return False
    await db.delete(db_obj)
    await db.commit()
    return True
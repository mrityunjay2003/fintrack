import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.finance import ImportBatch, Transaction, Account

async def create_import_batch(db: AsyncSession, account_id: uuid.UUID, filename: str) -> ImportBatch:
    batch = ImportBatch(account_id=account_id, filename=filename, status="preview")
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return batch

async def get_import_batch(db: AsyncSession, batch_id: uuid.UUID) -> Optional[ImportBatch]:
    return await db.get(ImportBatch, batch_id)

async def update_account_mapping(db: AsyncSession, account_id: uuid.UUID, mapping: dict):
    account = await db.get(Account, account_id)
    if account:
        account.csv_column_mapping = mapping
        await db.commit()

async def get_existing_hashes(db: AsyncSession, account_id: uuid.UUID, hashes: List[str]) -> set[str]:
    """Returns a set of dedup_hashes that already exist in the database for this account."""
    if not hashes:
        return set()
    res = await db.execute(
        select(Transaction.dedup_hash)
        .where(Transaction.account_id == account_id, Transaction.dedup_hash.in_(hashes))
    )
    return set(res.scalars().all())
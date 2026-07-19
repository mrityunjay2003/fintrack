from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
import uuid

from app.core.db import get_db
from app.schemas.finance import (
    Transaction, TransactionCreate, TransactionUpdate, 
    TransactionBulkUpdate, PaginatedTransactions
)
from app.crud import transactions as crud_txns

router = APIRouter()

@router.get("", response_model=PaginatedTransactions)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    account_id: Optional[uuid.UUID] = None,
    category_id: Optional[uuid.UUID] = None,
    type: Optional[str] = None,
    min_amount: Optional[int] = None,
    max_amount: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    items, total = await crud_txns.get_transactions(
        db=db, page=page, page_size=page_size, search=search,
        from_date=from_date, to_date=to_date, account_id=account_id,
        category_id=category_id, type_=type, min_amount=min_amount, max_amount=max_amount
    )
    return PaginatedTransactions(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.post("", response_model=Transaction)
async def create_transaction(txn_in: TransactionCreate, db: AsyncSession = Depends(get_db)):
    return await crud_txns.create_transaction(db, txn_in)

@router.patch("/{txn_id}", response_model=Transaction)
async def update_transaction(txn_id: uuid.UUID, txn_in: TransactionUpdate, db: AsyncSession = Depends(get_db)):
    txn = await crud_txns.update_transaction(db, txn_id, txn_in)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@router.post("/bulk")
async def bulk_update(bulk_in: TransactionBulkUpdate, db: AsyncSession = Depends(get_db)):
    updated_count = await crud_txns.bulk_update_transactions(db, bulk_in)
    return {"status": "ok", "updatedCount": updated_count}

@router.delete("/{txn_id}")
async def delete_transaction(txn_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    success = await crud_txns.delete_transaction(db, txn_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"ok": True}
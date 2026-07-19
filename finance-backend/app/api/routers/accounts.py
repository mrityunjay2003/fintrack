from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.db import get_db
from app.schemas.finance import Account, AccountCreate, AccountUpdate
from app.crud import settings as crud_settings

router = APIRouter()

@router.get("", response_model=List[Account])
async def read_accounts(db: AsyncSession = Depends(get_db)):
    return await crud_settings.get_accounts(db)

@router.post("", response_model=Account)
async def create_account(account: AccountCreate, db: AsyncSession = Depends(get_db)):
    return await crud_settings.create_account(db, account)

@router.patch("/{account_id}", response_model=Account)
async def update_account(account_id: uuid.UUID, account_in: AccountUpdate, db: AsyncSession = Depends(get_db)):
    account = await crud_settings.update_account(db, account_id, account_in)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@router.delete("/{account_id}")
async def delete_account(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    success = await crud_settings.delete_account(db, account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"ok": True}
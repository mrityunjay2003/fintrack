from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.db import get_db
from app.schemas.finance import Category, CategoryCreate, CategoryUpdate
from app.crud import settings as crud_settings

router = APIRouter()

@router.get("", response_model=List[Category])
async def read_categories(db: AsyncSession = Depends(get_db)):
    return await crud_settings.get_categories(db)

@router.post("", response_model=Category)
async def create_category(category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    return await crud_settings.create_category(db, category)

@router.patch("/{category_id}", response_model=Category)
async def update_category(category_id: uuid.UUID, category_in: CategoryUpdate, db: AsyncSession = Depends(get_db)):
    category = await crud_settings.update_category(db, category_id, category_in)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.delete("/{category_id}")
async def delete_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    success = await crud_settings.delete_category(db, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.db import get_db
from app.schemas.finance import Budget, BudgetCreate, BudgetUpdate
from app.crud import budgets as crud_budgets

router = APIRouter()

@router.get("", response_model=List[Budget])
async def read_budgets(
    month: str = Query(..., description="YYYY-MM"),
    db: AsyncSession = Depends(get_db)
):
    return await crud_budgets.get_budgets_for_month(db, month)

@router.post("", response_model=Budget)
async def create_budget(budget: BudgetCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud_budgets.create_budget(db, budget)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{budget_id}", response_model=Budget)
async def update_budget(budget_id: uuid.UUID, budget_in: BudgetUpdate, db: AsyncSession = Depends(get_db)):
    budget = await crud_budgets.update_budget(db, budget_id, budget_in)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@router.delete("/{budget_id}")
async def delete_budget(budget_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    success = await crud_budgets.delete_budget(db, budget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"ok": True}

@router.post("/copy")
async def copy_budgets(
    from_month: str = Query(..., alias="from", description="YYYY-MM"),
    to_month: str = Query(..., alias="to", description="YYYY-MM"),
    db: AsyncSession = Depends(get_db)
):
    copied = await crud_budgets.copy_budgets(db, from_month, to_month)
    return {"status": "ok", "copiedCount": copied}
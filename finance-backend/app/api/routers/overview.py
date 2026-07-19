from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date
import uuid

from app.core.db import get_db
from app.schemas.finance import Account, KPIsResponse, CategorySpend, TrendPoint, Insight, ReconciliationResponse
from app.services import analytics

router = APIRouter()

@router.get("/accounts", response_model=List[Account])
async def get_overview_accounts(db: AsyncSession = Depends(get_db)):
    return await analytics.get_dashboard_accounts(db)

@router.get("/kpis", response_model=KPIsResponse)
async def get_kpis(
    from_date: Optional[date] = Query(None, alias="start"),
    to_date: Optional[date] = Query(None, alias="end"),
    db: AsyncSession = Depends(get_db)
):
    return await analytics.get_kpis(db, from_date, to_date)

@router.get("/category-spend", response_model=List[CategorySpend])
async def get_category_spend(
    from_date: Optional[date] = Query(None, alias="start"),
    to_date: Optional[date] = Query(None, alias="end"),
    db: AsyncSession = Depends(get_db)
):
    return await analytics.get_category_spend(db, from_date, to_date)

@router.get("/trend", response_model=List[TrendPoint])
async def get_trend(
    from_date: Optional[date] = Query(None, alias="start"),
    to_date: Optional[date] = Query(None, alias="end"),
    db: AsyncSession = Depends(get_db)
):
    return await analytics.get_spending_trend(db, from_date, to_date)

@router.get("/insights", response_model=List[Insight])
async def get_insights(
    from_date: Optional[date] = Query(None, alias="start"),
    to_date: Optional[date] = Query(None, alias="end"),
    db: AsyncSession = Depends(get_db)
):
    return await analytics.generate_insights(db, from_date, to_date)

@router.get("/reconciliation/{account_id}", response_model=ReconciliationResponse)
async def get_account_reconciliation(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        return await analytics.get_reconciliation(db, account_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
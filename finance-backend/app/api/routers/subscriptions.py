from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.db import get_db
from app.schemas.finance import Subscription, SubscriptionUpdate
from app.crud import subscriptions as crud_subscriptions
from app.services import recurring

router = APIRouter()

@router.get("", response_model=List[Subscription])
async def read_subscriptions(db: AsyncSession = Depends(get_db)):
    return await crud_subscriptions.get_subscriptions(db)

@router.post("/detect")
async def trigger_detection(db: AsyncSession = Depends(get_db)):
    detected_count = await recurring.detect_subscriptions(db)
    return {"status": "ok", "detectedCount": detected_count}

@router.patch("/{sub_id}", response_model=Subscription)
async def update_subscription_status(
    sub_id: uuid.UUID, 
    sub_update: SubscriptionUpdate, 
    db: AsyncSession = Depends(get_db)
):
    sub = await crud_subscriptions.update_subscription_status(db, sub_id, sub_update)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub
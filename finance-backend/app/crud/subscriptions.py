import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import Subscription
from app.schemas.finance import SubscriptionUpdate

async def get_subscriptions(db: AsyncSession) -> List[Subscription]:
    query = (
        select(Subscription)
        .options(selectinload(Subscription.account))
        .order_by(Subscription.next_date.asc())
    )
    res = await db.execute(query)
    return res.scalars().all()

async def update_subscription_status(db: AsyncSession, sub_id: uuid.UUID, obj_in: SubscriptionUpdate) -> Optional[Subscription]:
    db_obj = await db.get(Subscription, sub_id)
    if not db_obj:
        return None
    
    db_obj.status = obj_in.status
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
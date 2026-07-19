from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import uuid

from app.core.db import get_db
from app.schemas.finance import Rule, RuleCreate, RuleUpdate
from app.crud import settings as crud_settings
from app.services.categorization import apply_rules_to_transactions

router = APIRouter()

@router.get("", response_model=List[Rule])
async def read_rules(db: AsyncSession = Depends(get_db)):
    return await crud_settings.get_rules(db)

@router.post("", response_model=Rule)
async def create_rule(rule: RuleCreate, db: AsyncSession = Depends(get_db)):
    return await crud_settings.create_rule(db, rule)

@router.patch("/{rule_id}", response_model=Rule)
async def update_rule(rule_id: uuid.UUID, rule_in: RuleUpdate, db: AsyncSession = Depends(get_db)):
    rule = await crud_settings.update_rule(db, rule_id, rule_in)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.delete("/{rule_id}")
async def delete_rule(rule_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    success = await crud_settings.delete_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"ok": True}

@router.post("/apply")
async def apply_rules(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    modified = await apply_rules_to_transactions(db)
    return {"status": "ok", "modifiedCount": modified}
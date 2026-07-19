import re
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.finance import Rule, Transaction

async def apply_rules_to_transactions(db: AsyncSession) -> int:
    """
    Evaluates all enabled rules in priority order against all transactions.
    Updates categories and labels if a match is found.
    """
    # 1. Fetch enabled rules (Ordered by priority ASC, assuming 1 is highest)
    rules_res = await db.execute(
        select(Rule).where(Rule.enabled == True).order_by(Rule.priority.asc())
    )
    rules = rules_res.scalars().all()
    
    # 2. Fetch all transactions 
    txns_res = await db.execute(select(Transaction))
    txns = txns_res.scalars().all()
    
    modified_count = 0
    
    for txn in txns:
        for rule in rules:
            target = txn.raw_details if rule.match_field == "raw_details" else txn.label
            if not target:
                continue
                
            try:
                # Apply regex/substring matching case-insensitively
                if re.search(rule.pattern, target, re.IGNORECASE):
                    txn.category_id = rule.category_id
                    txn.subcategory_id = rule.subcategory_id
                    if rule.set_label:
                        txn.label = rule.set_label
                    
                    modified_count += 1
                    break # Stop applying rules to this transaction after the first match
            except re.error:
                continue # Skip invalid regex patterns safely
                
    if modified_count > 0:
        await db.commit()
        
    return modified_count

# --- Append to app/services/categorization.py ---

async def apply_rules_to_single_transaction(db: AsyncSession, txn: Transaction) -> bool:
    """
    Applies rules to a single transaction (used during manual creation or import).
    Returns True if the transaction was categorized.
    """
    rules_res = await db.execute(
        select(Rule).where(Rule.enabled == True).order_by(Rule.priority.asc())
    )
    rules = rules_res.scalars().all()
    
    for rule in rules:
        target = txn.raw_details if rule.match_field == "raw_details" else txn.label
        if not target:
            continue
            
        try:
            if re.search(rule.pattern, target, re.IGNORECASE):
                txn.category_id = rule.category_id
                txn.subcategory_id = rule.subcategory_id
                if rule.set_label:
                    txn.label = rule.set_label
                return True
        except re.error:
            continue
            
    return False
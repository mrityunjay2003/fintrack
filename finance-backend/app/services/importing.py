import os
import uuid
import pandas as pd
import numpy as np
import re
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.models.finance import Transaction, Account, Rule
from app.schemas.finance import ImportMapping, PreviewRow
from app.crud.transactions import generate_dedup_hash
from app.crud.imports import get_existing_hashes
from sqlalchemy import select

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def clean_label(raw: str) -> str:
    """Strips junk prefixes and excessive whitespace from bank statements."""
    clean = re.sub(r'(?i)^(POS|UPI|IMPS|NEFT|RTGS|ACH|WIRE)\b[\s\-]*', '', raw)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

async def generate_preview(db: AsyncSession, filepath: str, account_id: uuid.UUID, mapping: ImportMapping) -> List[PreviewRow]:
    df = pd.read_csv(filepath, keep_default_na=False)
    
    # Pre-fetch rules for categorization
    rules = (await db.execute(select(Rule).where(Rule.enabled == True).order_by(Rule.priority.asc()))).scalars().all()
    
    preview_rows = []
    hash_list = []
    
    for index, row in df.iterrows():
        try:
            raw_date_str = str(row.get(mapping.date_col, "")).strip()
            if not raw_date_str:
                continue
                
            # 1. Let Pandas magically auto-detect the date format!
            # dayfirst=True ensures 02-09 is read as Sept 2nd, not Feb 9th.
            parsed_timestamp = pd.to_datetime(raw_date_str, format='mixed', dayfirst=True)
            txn_date = parsed_timestamp.date()
            
            raw_details = str(row.get(mapping.details_col, "")).strip()
            
            # 2. Safely strip blank cells so float conversion doesn't crash
            debit_val = str(row.get(mapping.debit_col, "")).replace(',', '').strip() if mapping.debit_col else ""
            credit_val = str(row.get(mapping.credit_col, "")).replace(',', '').strip() if mapping.credit_col else ""
            
            debit = float(debit_val) if debit_val else 0.0
            credit = float(credit_val) if credit_val else 0.0
            
            amount_cents = int(round((credit - debit) * 100))
            if amount_cents == 0:
                continue 
            
            balance_cents = None
            if mapping.balance_col:
                bal_val = str(row.get(mapping.balance_col, "")).replace(',', '').strip()
                if bal_val:
                    balance_cents = int(round(float(bal_val) * 100))

            dedup_hash = generate_dedup_hash(account_id, txn_date, amount_cents, raw_details)
            hash_list.append(dedup_hash)
            
            label = clean_label(raw_details)
            cat_id, subcat_id = None, None
            
            for rule in rules:
                target = raw_details if rule.match_field == "raw_details" else label
                try:
                    if re.search(rule.pattern, target, re.IGNORECASE):
                        cat_id = rule.category_id
                        subcat_id = rule.subcategory_id
                        if rule.set_label:
                            label = rule.set_label
                        break
                except re.error:
                    pass

            preview_rows.append(PreviewRow(
                row_index=index,
                date=txn_date,
                raw_details=raw_details,
                label=label,
                amount=amount_cents,
                statement_balance=balance_cents,
                is_duplicate=False, 
                category_id=cat_id,
                subcategory_id=subcat_id
            ))
            
        except Exception as e:
            # If a row fails, this prints EXACTLY why in your Python terminal!
            print(f"Row {index} skipped due to error: {e}")
            continue

    # Bulk check duplicates
    existing_hashes = await get_existing_hashes(db, account_id, hash_list)
    for pr in preview_rows:
        row_hash = generate_dedup_hash(account_id, pr.date, pr.amount, pr.raw_details)
        if row_hash in existing_hashes:
            pr.is_duplicate = True

    return preview_rows
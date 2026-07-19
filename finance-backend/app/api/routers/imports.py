import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd

from app.core.db import get_db
from app.models.finance import Account, Transaction
from app.schemas.finance import UploadResponse, ImportMapping, ImportPreviewResponse, ImportCommitRequest
from app.crud import imports as crud_imports
from app.services.importing import UPLOAD_DIR, generate_preview
from app.crud.transactions import generate_dedup_hash

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...), 
    account_id: uuid.UUID = Form(...),
    db: AsyncSession = Depends(get_db)
):
    account = await db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    file_ext = file.filename.split('.')[-1]
    saved_filename = f"{uuid.uuid4()}.{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, saved_filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Read just the headers
    df = pd.read_csv(filepath, nrows=0)
    headers = list(df.columns)
    
    batch = await crud_imports.create_import_batch(db, account_id, saved_filename)

    return UploadResponse(
        batch_id=batch.id,
        headers=headers,
        saved_mapping=account.csv_column_mapping
    )

@router.post("/{batch_id}/preview", response_model=ImportPreviewResponse)
async def preview_import(
    batch_id: uuid.UUID,
    mapping: ImportMapping,
    db: AsyncSession = Depends(get_db)
):
    batch = await crud_imports.get_import_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Persist the mapping to the account so the user doesn't have to map again next month
    await crud_imports.update_account_mapping(db, batch.account_id, mapping.model_dump())

    filepath = os.path.join(UPLOAD_DIR, batch.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=400, detail="File lost. Please re-upload.")

    preview_rows = await generate_preview(db, filepath, batch.account_id, mapping)
    
    new_count = sum(1 for r in preview_rows if not r.is_duplicate)
    duplicate_count = sum(1 for r in preview_rows if r.is_duplicate)

    return ImportPreviewResponse(
        batch_id=batch.id,
        rows=preview_rows,
        new_count=new_count,
        duplicate_count=duplicate_count
    )

@router.post("/{batch_id}/commit")
async def commit_import(
    batch_id: uuid.UUID,
    commit_req: ImportCommitRequest,
    db: AsyncSession = Depends(get_db)
):
    batch = await crud_imports.get_import_batch(db, batch_id)
    if not batch or batch.status != "preview":
        raise HTTPException(status_code=400, detail="Invalid batch or already committed")

    account = await db.get(Account, batch.account_id)
    mapping = ImportMapping(**account.csv_column_mapping)
    filepath = os.path.join(UPLOAD_DIR, batch.filename)

    # Re-generate preview to get the exact data payload, but filter to `included_row_indexes`
    preview_rows = await generate_preview(db, filepath, batch.account_id, mapping)
    included_set = set(commit_req.included_row_indexes)
    rows_to_insert = [r for r in preview_rows if r.row_index in included_set and not r.is_duplicate]

    transactions = []
    for row in rows_to_insert:
        transactions.append(
            Transaction(
                account_id=batch.account_id,
                date=row.date,
                raw_details=row.raw_details,
                label=row.label,
                amount=row.amount,
                type="expense" if row.amount < 0 else "income",
                category_id=row.category_id,
                subcategory_id=row.subcategory_id,
                source="import",
                statement_balance=row.statement_balance,
                is_transfer=False,
                import_batch_id=batch.id,
                dedup_hash=generate_dedup_hash(batch.account_id, row.date, row.amount, row.raw_details)
            )
        )
    
    db.add_all(transactions)
    
    batch.status = "committed"
    batch.new_count = len(transactions)
    
    await db.commit()

    # Clean up file
    if os.path.exists(filepath):
        os.remove(filepath)

    return {"status": "ok", "inserted_count": len(transactions)}
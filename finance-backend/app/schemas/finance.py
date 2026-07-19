from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from typing import Optional, List, Any
from datetime import date, datetime
import uuid

class CamelModel(BaseModel):
    """Base model that auto-converts snake_case to camelCase for JSON."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

# --- Category Schemas ---
class CategoryBase(CamelModel):
    name: str
    kind: Optional[str] = None # income | expense | transfer | null
    color: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    sort_order: int = 0

class Category(CategoryBase):
    id: uuid.UUID

# --- Account Schemas ---
class AccountBase(CamelModel):
    name: str
    bank: str
    type: str
    currency: str = "INR"
    color: Optional[str] = None

class Account(AccountBase):
    id: uuid.UUID
    opening_balance: int
    # These fields are computed at runtime by the API
    balance: Optional[int] = None 
    month_change_percent: Optional[float] = None
    mask: str = "0000" # Dummy mask for the frontend

# --- Transaction Schemas ---
class TransactionBase(CamelModel):
    account_id: uuid.UUID
    date: date
    amount: int
    type: str
    label: str
    category_id: Optional[uuid.UUID] = None
    subcategory_id: Optional[uuid.UUID] = None
    is_transfer: bool = False
    is_subscription: bool = Field(default=False, alias="isSubscription")
    notes: Optional[str] = Field(default=None, alias="notes", validation_alias="raw_details")

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: uuid.UUID
    source: str
    statement_balance: Optional[int] = None
    dedup_hash: str
    
    # Optional expanded relationships for the frontend
    category: Optional[Category] = None
    account: Optional[Account] = None

# --- Rule Schemas ---
class RuleBase(CamelModel):
    match_field: str
    pattern: str
    category_id: uuid.UUID
    set_label: Optional[str] = None
    priority: int = 0
    enabled: bool = True

class Rule(RuleBase):
    id: uuid.UUID
    category: Optional[Category] = None

# --- Budget Schemas ---
class BudgetBase(CamelModel):
    category_id: uuid.UUID
    month: str
    limit_amount: int = Field(..., alias="amount") # Map limit_amount to amount for frontend

class Budget(BudgetBase):
    id: uuid.UUID
    spent: Optional[int] = None # Computed at runtime
    category: Optional[Category] = None

# --- Subscription Schemas ---
class SubscriptionBase(CamelModel):
    merchant_label: str = Field(..., alias="merchant")
    account_id: uuid.UUID
    cadence: str
    amount: int
    next_date: date
    confidence: float
    status: str

class Subscription(SubscriptionBase):
    id: uuid.UUID
    account: Optional[Account] = None

# --- Append to app/schemas/finance.py ---

class AccountCreate(AccountBase):
    opening_balance: int

class AccountUpdate(CamelModel):
    name: Optional[str] = None
    bank: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CamelModel):
    name: Optional[str] = None
    kind: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    sort_order: Optional[int] = None

class RuleCreate(RuleBase):
    pass

class RuleUpdate(CamelModel):
    match_field: Optional[str] = None
    pattern: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    set_label: Optional[str] = None
    priority: Optional[int] = None
    enabled: Optional[bool] = None

    # --- Append to app/schemas/finance.py ---

class TransactionUpdate(CamelModel):
    label: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    subcategory_id: Optional[uuid.UUID] = None
    type: Optional[str] = None
    is_transfer: Optional[bool] = None
    subscription_id: Optional[uuid.UUID] = None

class TransactionBulkUpdate(CamelModel):
    ids: List[uuid.UUID]
    category_id: Optional[uuid.UUID] = None
    is_transfer: Optional[bool] = None
    create_rule_keyword: Optional[str] = None # Automatically create a rule from this edit

class PaginatedTransactions(CamelModel):
    items: List[Transaction]
    total: int
    page: int
    page_size: int

# We also need to add running_balance to the Transaction schema defined in Step 3.
# Since Pydantic models are already defined, we'll patch it in here for clarity:
# (In a real file, you would just add this field to the `Transaction` class in Step 3)
Transaction.model_fields['running_balance'] = Field(default=None, annotation=Optional[int])
Transaction.model_rebuild(force=True)

# --- Append to app/schemas/finance.py ---

class ImportMapping(CamelModel):
    date_col: str
    details_col: str
    debit_col: Optional[str] = None
    credit_col: Optional[str] = None
    balance_col: Optional[str] = None
    date_format: str = "%Y-%m-%d" # e.g., %d/%m/%Y

class UploadResponse(CamelModel):
    batch_id: uuid.UUID
    headers: List[str]
    saved_mapping: Optional[ImportMapping] = None

class PreviewRow(CamelModel):
    row_index: int
    date: date
    raw_details: str
    label: str
    amount: int
    statement_balance: Optional[int]
    is_duplicate: bool
    category_id: Optional[uuid.UUID] = None
    subcategory_id: Optional[uuid.UUID] = None

class ImportPreviewResponse(CamelModel):
    batch_id: uuid.UUID
    rows: List[PreviewRow]
    duplicate_count: int
    new_count: int

class ImportCommitRequest(CamelModel):
    included_row_indexes: List[int]

    # --- Append to app/schemas/finance.py ---

class KPIsResponse(CamelModel):
    income: int
    expense: int
    net: int
    savings_rate: float

class CategorySpend(CamelModel):
    name: str
    value: int
    color_hex: str
    category_id: uuid.UUID

class TrendPoint(CamelModel):
    date: str
    amount: int

class Insight(CamelModel):
    type: str # 'info', 'warning', 'success', 'error'
    title: str
    detail: str
    severity: int # 1 (low) to 3 (high)

class ReconciliationResponse(CamelModel):
    account_id: uuid.UUID
    latest_txn_date: Optional[date]
    statement_balance: Optional[int]
    computed_balance: Optional[int]
    is_reconciled: bool
    difference: int

    # --- Append to app/schemas/finance.py ---

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(CamelModel):
    limit_amount: Optional[int] = Field(None, alias="amount")
    # --- Append to app/schemas/finance.py ---

class SubscriptionUpdate(CamelModel):
    status: str # 'active' | 'dismissed'
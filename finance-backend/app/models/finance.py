from typing import Optional, Any
from datetime import date, datetime, UTC
import uuid
from sqlalchemy import String, Integer, Boolean, Float, Date, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

def utc_now() -> datetime:
    return datetime.now(UTC)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, index=True)
    bank: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)  # checking | savings | credit
    currency: Mapped[str] = mapped_column(String, default="INR")
    opening_balance: Mapped[int] = mapped_column(Integer, default=0) # cents
    color: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    csv_column_mapping: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", foreign_keys="Transaction.account_id", back_populates="account"
    )
    import_batches: Mapped[list["ImportBatch"]] = relationship(
        "ImportBatch", back_populates="account"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        "Subscription", back_populates="account"
    )

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    kind: Mapped[Optional[str]] = mapped_column(String, nullable=True) # income | expense | transfer | null
    color: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Self-referential relationship for subcategories
    parent: Mapped[Optional["Category"]] = relationship(
        "Category",
        remote_side=[id],
        backref="subcategories",
    )

class ImportBatch(Base, TimestampMixin):
    __tablename__ = "import_batches"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id"))
    filename: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String) # preview | committed | discarded
    new_count: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0)
    column_mapping: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    account: Mapped["Account"] = relationship("Account", back_populates="import_batches")
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", foreign_keys="Transaction.import_batch_id", back_populates="import_batch"
    )

class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    merchant_label: Mapped[str] = mapped_column(String)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id"))
    cadence: Mapped[str] = mapped_column(String) # monthly | quarterly | annual
    amount: Mapped[int] = mapped_column(Integer) # cents
    next_date: Mapped[date] = mapped_column(Date)
    confidence: Mapped[float] = mapped_column(Float) # 0 to 1
    status: Mapped[str] = mapped_column(String) # detected | confirmed | dismissed

    account: Mapped["Account"] = relationship("Account", back_populates="subscriptions")
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", foreign_keys="Transaction.subscription_id", back_populates="subscription"
    )

class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"
    __table_args__ = (
        UniqueConstraint("account_id", "dedup_hash", name="uq_account_dedup_hash"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id"))
    date: Mapped[date] = mapped_column(Date, index=True)
    raw_details: Mapped[str] = mapped_column(String)
    label: Mapped[str] = mapped_column(String)
    amount: Mapped[int] = mapped_column(Integer) # signed cents
    type: Mapped[str] = mapped_column(String) # income | expense | transfer
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    subcategory_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    source: Mapped[str] = mapped_column(String) # manual | import
    statement_balance: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # cents
    is_transfer: Mapped[bool] = mapped_column(Boolean, default=False)
    subscription_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("subscriptions.id"), nullable=True)
    import_batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("import_batches.id"), nullable=True)
    dedup_hash: Mapped[str] = mapped_column(String, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    account: Mapped["Account"] = relationship(
        "Account", foreign_keys=[account_id], back_populates="transactions"
    )
    category: Mapped[Optional["Category"]] = relationship(
        "Category", foreign_keys=[category_id]
    )
    subcategory: Mapped[Optional["Category"]] = relationship(
        "Category", foreign_keys=[subcategory_id]
    )
    subscription: Mapped[Optional["Subscription"]] = relationship(
        "Subscription", foreign_keys=[subscription_id], back_populates="transactions"
    )
    import_batch: Mapped[Optional["ImportBatch"]] = relationship(
        "ImportBatch", foreign_keys=[import_batch_id], back_populates="transactions"
    )

class Rule(Base):
    __tablename__ = "rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    match_field: Mapped[str] = mapped_column(String) # label | raw_details
    pattern: Mapped[str] = mapped_column(String)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"))
    subcategory_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    set_label: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    category: Mapped["Category"] = relationship("Category", foreign_keys=[category_id])
    subcategory: Mapped[Optional["Category"]] = relationship("Category", foreign_keys=[subcategory_id])

class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("category_id", "month", name="uq_category_month"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"))
    month: Mapped[str] = mapped_column(String) # YYYY-MM
    limit_amount: Mapped[int] = mapped_column(Integer) # cents

    category: Mapped["Category"] = relationship("Category", foreign_keys=[category_id])
import asyncio
import uuid
import hashlib
from datetime import date, timedelta
from app.core.db import AsyncSessionLocal
from app.models.finance import Account, Category, Transaction, Rule, Budget, Subscription

def generate_hash(account_id, txn_date, amount, raw_details):
    s = f"{account_id}|{txn_date.isoformat()}|{amount}|{raw_details}"
    return hashlib.sha256(s.encode()).hexdigest()

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("Seeding database...")
        
        # 1. Accounts
        hdfc = Account(
            id=uuid.UUID('00000000-0000-0000-0000-000000000001'),
            name="Primary Checking",
            bank="HDFC",
            type="checking",
            opening_balance=12500000, # 125,000.00
            color="blue"
        )
        sbi = Account(
            id=uuid.UUID('00000000-0000-0000-0000-000000000002'),
            name="Rewards Card",
            bank="SBI",
            type="credit",
            opening_balance=-1500000, # -15,000.00
            color="indigo"
        )
        db.add_all([hdfc, sbi])
        
        # 2. Categories
        cat_income = Category(id=uuid.uuid4(), name="Salary", kind="income", color="bg-green-600")
        cat_housing = Category(id=uuid.uuid4(), name="Housing", kind="expense", color="bg-emerald-500")
        cat_food = Category(id=uuid.uuid4(), name="Food & Dining", kind="expense", color="bg-amber-500")
        cat_transport = Category(id=uuid.uuid4(), name="Transportation", kind="expense", color="bg-sky-500")
        cat_utils = Category(id=uuid.uuid4(), name="Utilities", kind="expense", color="bg-purple-500")
        
        db.add_all([cat_income, cat_housing, cat_food, cat_transport, cat_utils])
        await db.flush() # Flush to get IDs

        # 3. Rules
        rules = [
            Rule(match_field="raw_details", pattern="uber", category_id=cat_transport.id, set_label="Uber", priority=1),
            Rule(match_field="raw_details", pattern="swiggy", category_id=cat_food.id, set_label="Swiggy", priority=1),
            Rule(match_field="raw_details", pattern="netflix", category_id=cat_utils.id, set_label="Netflix", priority=1),
            Rule(match_field="raw_details", pattern="tech corp", category_id=cat_income.id, set_label="Tech Corp Payroll", priority=1),
        ]
        db.add_all(rules)

        # 4. Transactions (Last 3 months)
        today = date.today()
        txns = []
        
        # Helper to create transactions
        def add_txn(acc, t_date, amount, label, raw, cat_id, type_):
            t = Transaction(
                account_id=acc.id,
                date=t_date,
                amount=amount,
                type=type_,
                label=label,
                raw_details=raw,
                category_id=cat_id,
                source="import",
                is_transfer=False,
                dedup_hash=generate_hash(acc.id, t_date, amount, raw)
            )
            txns.append(t)

        for i in range(3):
            month_offset = today - timedelta(days=i*30)
            
            # Income
            add_txn(hdfc, month_offset.replace(day=1), 15500000, "Tech Corp Payroll", "ACH TECH CORP PAYROLL", cat_income.id, "income")
            # Rent
            add_txn(hdfc, month_offset.replace(day=5), -3500000, "Landlord Rent", "WIRE TRANSFER RENT", cat_housing.id, "expense")
            # Food
            add_txn(sbi, month_offset.replace(day=12), -125000, "Swiggy", "POS SWIGGY MUMBAI", cat_food.id, "expense")
            add_txn(sbi, month_offset.replace(day=20), -85000, "Uber", "UBER TRIP HELP.UBER.COM", cat_transport.id, "expense")
            add_txn(sbi, month_offset.replace(day=28), -64900, "Netflix", "NETFLIX.COM", cat_utils.id, "expense")

        db.add_all(txns)

        # 5. Budgets (Current Month)
        current_month = today.strftime("%Y-%m")
        db.add_all([
            Budget(category_id=cat_food.id, month=current_month, limit_amount=1500000), # 15k
            Budget(category_id=cat_transport.id, month=current_month, limit_amount=500000), # 5k
        ])
        
        await db.commit()
        print("Seed data injected successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
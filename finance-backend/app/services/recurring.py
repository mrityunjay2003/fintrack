import pandas as pd
from datetime import timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import Transaction, Subscription

async def detect_subscriptions(db: AsyncSession) -> int:
    """
    Scans transactions using pandas to find recurring patterns.
    Inserts newly detected subscriptions into the database.
    """
    # 1. Fetch relevant expenses (exclude transfers)
    query = select(
        Transaction.account_id, 
        Transaction.label, 
        Transaction.date, 
        Transaction.amount
    ).where(
        Transaction.type == 'expense',
        Transaction.is_transfer == False,
        Transaction.deleted_at.is_(None)
    )
    
    res = await db.execute(query)
    txns = res.all()
    
    if not txns:
        return 0

    # 2. Load into Pandas for vectorized time-series analysis
    df = pd.DataFrame(txns, columns=["account_id", "label", "date", "amount"])
    df['date'] = pd.to_datetime(df['date'])
    
    # Pre-fetch existing subscriptions so we don't duplicate them
    existing_subs_query = await db.execute(select(Subscription.account_id, Subscription.merchant_label))
    existing_subs = {(str(row[0]), row[1]) for row in existing_subs_query.all()}
    
    new_subscriptions = []

    # 3. Group by Account + Merchant
    for (acc_id, label), group in df.groupby(['account_id', 'label']):
        if len(group) < 2:
            continue # Need at least 2 transactions to detect a cadence
            
        # Check if we already track this
        if (str(acc_id), label) in existing_subs:
            continue

        group = group.sort_values('date')
        
        # Calculate days between transactions
        group['days_diff'] = group['date'].diff().dt.days
        diffs = group['days_diff'].dropna()
        
        avg_diff = diffs.mean()
        diff_std = diffs.std() if len(diffs) > 1 else 0.0
        
        # Check amount stability (Coefficient of Variation)
        avg_amount = group['amount'].mean()
        amount_std = group['amount'].std() if len(group) > 1 else 0.0
        amount_cv = abs(amount_std / avg_amount) if avg_amount != 0 else 1.0

        # If amounts fluctuate wildly (>20% variance), it's likely not a fixed subscription
        if amount_cv > 0.20:
            continue
            
        # 4. Map interval to cadence heuristically
        cadence = None
        if 25 <= avg_diff <= 35:
            cadence = 'monthly'
        elif 6 <= avg_diff <= 8:
            cadence = 'weekly'
        elif 85 <= avg_diff <= 95:
            cadence = 'quarterly'
        elif 350 <= avg_diff <= 380:
            cadence = 'annual'
            
        if not cadence:
            continue

        # Calculate Confidence (Penalize for high date variance or few data points)
        confidence = 0.9
        if diff_std > 4 or amount_cv > 0.05:
            confidence -= 0.2
        if len(group) == 2:
            confidence -= 0.3
            
        confidence = max(round(confidence, 2), 0.1)
        
        # Predict next date
        last_date = group['date'].max()
        next_date = (last_date + pd.Timedelta(days=avg_diff)).date()
        
        # Emit detection
        new_subscriptions.append(
            Subscription(
                account_id=acc_id,
                merchant_label=label,
                cadence=cadence,
                amount=int(avg_amount), # Use the average historical amount
                next_date=next_date,
                confidence=confidence,
                status="detected"
            )
        )

    # 5. Bulk insert newly detected subscriptions
    if new_subscriptions:
        db.add_all(new_subscriptions)
        await db.commit()

    return len(new_subscriptions)
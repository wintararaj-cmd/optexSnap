# Delivery Boy Commission Fix

## Issue Summary
The delivery boy commission was not being displayed due to a **500 Internal Server Error** in the `/api/admin/payouts` endpoint.

## Root Cause
The payouts API route (`app/api/admin/payouts/route.ts`) was using an incorrect column name:
- **Used:** `delivery_boy_id`
- **Actual schema:** `user_id`

According to the database schema (`database/schema.sql`), the `payouts` table has the following structure:
```sql
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- ✓ Correct column name
    amount DECIMAL(10, 2) NOT NULL,
    payout_date DATE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Changes Made

### 1. Fixed POST Endpoint (Lines 5-27)
**Before:**
```typescript
const { delivery_boy_id, amount, notes } = body;
INSERT INTO payouts (delivery_boy_id, amount, notes) VALUES ($1, $2, $3)
```

**After:**
```typescript
const { user_id, amount, payout_date, payment_method, notes } = body;
INSERT INTO payouts (user_id, amount, payout_date, payment_method, notes) 
VALUES ($1, $2, $3, $4, $5)
```

**Changes:**
- Renamed `delivery_boy_id` → `user_id`
- Added missing fields: `payout_date`, `payment_method`
- Removed automatic expense creation (simplified logic)

### 2. Fixed GET Endpoint (Line 50)
**Before:**
```sql
COALESCE((SELECT SUM(amount) FROM payouts WHERE delivery_boy_id = u.id), 0)
```

**After:**
```sql
COALESCE((SELECT SUM(amount) FROM payouts WHERE user_id = u.id), 0)
```

### 3. Fixed Frontend Payouts Page (Line 59)
**Before:**
```typescript
body: JSON.stringify({
    delivery_boy_id: selectedBoy.id,
    amount: parseFloat(payAmount),
    notes
})
```

**After:**
```typescript
body: JSON.stringify({
    user_id: selectedBoy.id,
    amount: parseFloat(payAmount),
    notes
})
```

## How Commission Works

### Commission Calculation Flow:
1. **Delivery Boy Setup**: Admin sets commission rate and type (fixed/percentage) when creating/editing delivery boy
2. **Order Assignment**: Delivery boy accepts an order
3. **Order Completion**: When delivery boy marks order as "delivered", the system:
   - Fetches delivery boy's commission settings from `users` table
   - Calculates commission based on type:
     - **Percentage**: `(order_total × commission_rate) / 100`
     - **Fixed**: `commission_rate`
   - Stores result in `orders.driver_commission`

### Display Locations:
1. **Delivery Dashboard** (`app/delivery/page.tsx`):
   - Shows commission per order (line 212-217)
   - Shows total earnings at top (line 135, 157)

2. **Admin Payouts Report** (`/api/admin/payouts`):
   - Lists all delivery boys
   - Shows `total_earned` (sum of all commissions)
   - Shows `total_paid` (sum of all payouts)
   - Calculates `due_amount` (earned - paid)

## Testing Checklist
- [ ] Verify `/api/admin/payouts` returns 200 status (not 500)
- [ ] Check delivery dashboard shows commission for delivered orders
- [ ] Confirm commission calculation is correct for both fixed and percentage types
- [ ] Test payout creation with all required fields

## Related Files
- `app/api/admin/payouts/route.ts` - Fixed API endpoint (backend)
- `app/admin/payouts/page.tsx` - Fixed payouts page (frontend)
- `app/api/orders/[id]/route.ts` - Commission calculation logic
- `app/delivery/page.tsx` - Commission display on delivery dashboard
- `database/schema.sql` - Database schema reference

## Date Fixed
December 13, 2025

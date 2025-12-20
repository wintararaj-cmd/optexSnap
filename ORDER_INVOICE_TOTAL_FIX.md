# Order Total vs Invoice Total Discrepancy Fix

## Issue Description
The order list was showing ₹630.00 as the total amount, but when viewing the invoice for the same order, it showed ₹530.00. This was a data synchronization issue between the `orders` and `invoices` tables.

## Root Cause
When a discount was updated on an order through the Admin Orders page:
1. The `updateDiscount` function in `/app/admin/orders/page.tsx` correctly calculated the new total and sent both `discount` and `total_amount` to the API
2. However, the API endpoint `/app/api/orders/[id]/route.ts` had two problems:
   - The `discount` field was **missing** from the UPDATE query parameters
   - The corresponding invoice record was **not being updated** when order totals changed

This meant:
- The `orders` table would show the updated total (₹630.00)
- The `invoices` table would still show the old total (₹530.00)

## Solution Implemented

### Changes to `/app/api/orders/[id]/route.ts`

1. **Added `discount` to the request body destructuring** (line 52):
   ```typescript
   const {
       // ... other fields
       discount,  // ← Added this
       total_amount,
       // ... other fields
   } = body;
   ```

2. **Added `discount` to the UPDATE query** (line 97):
   ```typescript
   UPDATE orders 
   SET ...
       discount = COALESCE($10, discount),  // ← Added this
       total_amount = COALESCE($11, total_amount),
       ...
   ```

3. **Added invoice synchronization logic** (lines 129-142):
   ```typescript
   // Also update the corresponding invoice if discount, subtotal, tax, or total_amount changed
   if (discount !== undefined || subtotal !== undefined || tax !== undefined || total_amount !== undefined) {
       await query(
           `UPDATE invoices 
            SET subtotal = COALESCE($1, subtotal),
                tax = COALESCE($2, tax),
                discount = COALESCE($3, discount),
                total = COALESCE($4, total)
            WHERE order_id = $5`,
           [subtotal, tax, discount, total_amount, params.id]
       );
   }
   ```

## Testing
After this fix:
1. Update a discount on any order in the Admin Orders page
2. The order list will show the correct total
3. Click "View Invoice" - the invoice will now show the **same** total as the order list
4. Both the order and invoice records are now synchronized

## Impact
- **Fixed**: Order and invoice totals are now always in sync
- **No Breaking Changes**: Existing functionality remains intact
- **Data Integrity**: Any future updates to order totals will automatically update the corresponding invoice

## Date Fixed
December 20, 2025

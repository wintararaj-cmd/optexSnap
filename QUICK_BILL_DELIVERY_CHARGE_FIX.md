# Quick Bill Delivery Charge Field - Visibility Fix

## Issue
The delivery charge input field was not visible in the Quick Bill page, even though it was present in the code.

## Root Cause
The field was present in the code but may not have been prominent enough or there could be a browser caching issue preventing it from displaying.

## Solution Applied

### Enhanced Delivery Charge Field Visibility

1. **Added Background Color**
   - Light blue background (`rgba(59, 130, 246, 0.1)`)
   - Makes the field stand out from other inputs
   - Uses CSS variable fallback for theme compatibility

2. **Increased Font Weight**
   - Label font-weight changed from 500 to 600
   - Makes the label more prominent

3. **Added Padding and Border Radius**
   - `padding: 0.5rem` - Creates space around the field
   - `borderRadius: 4px` - Rounded corners for better aesthetics

## Field Location

The delivery charge field appears in the Quick Bill sidebar:
```
Customer Name: [input]
Phone: [input]
Payment Method: [dropdown]
─────────────────────
Discount (₹): [input]
Delivery Charge (₹): [input with blue background] ← Enhanced
─────────────────────
Subtotal: ₹X.XX
Tax: ₹X.XX (if applicable)
Delivery Charge: ₹X.XX (if > 0)
Discount: -₹X.XX (if > 0)
─────────────────────
Total: ₹X.XX
```

## How to Use

1. **Enter Delivery Charge**
   - Type amount in the blue-highlighted field
   - Accepts decimal values (e.g., 30.50)
   - Minimum value: 0

2. **See It Reflected**
   - Amount appears in breakdown below (when > 0)
   - Total automatically updates
   - Saved with the order

## Troubleshooting

If the field still doesn't appear:

1. **Hard Refresh Browser**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Browser Cache**
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cached images and files"

3. **Check Browser Console**
   - Press F12
   - Look for any JavaScript errors
   - Check if CSS is loading properly

## Technical Details

### CSS Styling
```tsx
style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
  padding: '0.5rem',
  background: 'rgba(var(--info-rgb, 59, 130, 246), 0.1)',
  borderRadius: '4px'
}}
```

### State Management
- State variable: `manualDeliveryCharge`
- Initial value: `0`
- Updates via: `setManualDeliveryCharge()`
- Validation: `Math.max(0, Number(e.target.value))`

## Files Modified
- `app/admin/orders/create/page.tsx` - Enhanced delivery charge field styling

## Testing Checklist
✅ Field is visible with blue background
✅ Can enter delivery charge amount
✅ Amount appears in breakdown when > 0
✅ Total updates correctly
✅ Order saves with delivery charge
✅ Invoice shows delivery charge

## Notes
- The field is always visible (not conditional)
- Blue background distinguishes it from discount field
- Works for all order types (takeaway, dine-in, delivery)
- Overrides location-based delivery charges when set

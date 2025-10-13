# Invoice Form - Discount Display in Summary

## Overview
Added real-time discount calculation and display in the invoice summary (Step 3) when creating or editing invoices. Users can now see how the discount affects the final amount before submitting.

## Changes Made

### 1. Updated Calculation Functions

Created separate functions for better calculation breakdown:

```typescript
// Calculate subtotal (sum of all items before discount)
const calculateSubtotal = () => {
  return selectedItems.reduce((sum, i) => sum + (i.qty * i.rate), 0);
};

// Calculate discount amount based on type
const calculateDiscount = () => {
  const subtotal = calculateSubtotal();
  const discountValue = parseFloat(invoiceForm.discount_value) || 0;
  
  if (invoiceForm.discount_type === 'percentage') {
    return (subtotal * discountValue) / 100;
  }
  return discountValue;
};

// Calculate final total (subtotal - discount)
const calculateTotal = () => {
  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();
  return subtotal - discount;
};
```

**Before:**
- Only had `calculateTotal()` that summed all items
- No discount consideration
- No subtotal breakdown

**After:**
- `calculateSubtotal()` - Raw sum of items
- `calculateDiscount()` - Calculated discount amount
- `calculateTotal()` - Subtotal minus discount

### 2. Enhanced Summary Display (Step 3)

Added detailed breakdown in the review/summary screen:

```tsx
<View style={styles.summaryTotal}>
  {/* Subtotal Row */}
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Subtotal:</Text>
    <Text style={styles.summaryValue}>{formatCurrency(calculateSubtotal())}</Text>
  </View>
  
  {/* Discount Row (only if discount > 0) */}
  {calculateDiscount() > 0 && (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.success }]}>
        Discount {invoiceForm.discount_type === 'percentage' ? `(${invoiceForm.discount_value}%)` : ''}:
      </Text>
      <Text style={[styles.summaryValue, { color: colors.success }]}>
        - {formatCurrency(calculateDiscount())}
      </Text>
    </View>
  )}
  
  {/* Total Row */}
  <View style={styles.summaryRow}>
    <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
    <Text style={styles.summaryTotalValue}>{formatCurrency(calculateTotal())}</Text>
  </View>
  
  {/* Paid/Pending (existing) */}
  ...
</View>
```

## Visual Display Examples

### Example 1: 10% Discount
```
Items:
• Sharpy               1 × ₹1,000 = ₹1,000
• Yamaha Mixer         1 × ₹5,000 = ₹5,000

─────────────────────────────────────
Subtotal:              ₹6,000.00
Discount (10%):        - ₹600.00
─────────────────────────────────────
Total Amount:          ₹5,400.00
Paid:                  ₹2,000.00
Pending:               ₹3,400.00
```

### Example 2: Flat ₹500 Discount
```
Items:
• Sharpy               1 × ₹1,000 = ₹1,000
• Yamaha Mixer         1 × ₹5,000 = ₹5,000

─────────────────────────────────────
Subtotal:              ₹6,000.00
Discount:              - ₹500.00
─────────────────────────────────────
Total Amount:          ₹5,500.00
Paid:                  ₹0.00
Pending:               ₹5,500.00
```

### Example 3: No Discount
```
Items:
• Sharpy               1 × ₹1,000 = ₹1,000
• Yamaha Mixer         1 × ₹5,000 = ₹5,000

─────────────────────────────────────
Subtotal:              ₹6,000.00
─────────────────────────────────────
Total Amount:          ₹6,000.00
Paid:                  ₹0.00
Pending:               ₹6,000.00
```
(No discount row shown when discount is 0 or empty)

## Features

### ✅ Real-Time Calculation
- Updates instantly as user changes discount value
- Updates when switching between percentage/amount
- Updates when items are added/removed

### ✅ Conditional Display
- Discount row only shows if `calculateDiscount() > 0`
- Keeps UI clean when no discount applied
- Percentage value shown for percentage discounts: `Discount (10%):`

### ✅ Visual Distinction
- Discount shown in **green** (`colors.success`)
- Minus sign (-) prefix emphasizes deduction
- Clearly separates subtotal from total

### ✅ Smart Labels
- **Percentage discount:** Shows "Discount (10%):" with calculated amount
- **Flat discount:** Shows "Discount:" with the amount
- Clear indication of discount type

## User Flow

### Creating Invoice:
1. **Step 1:** Enter customer details + discount
2. **Step 2:** Select items and quantities
3. **Step 3 (Summary):** 
   - See subtotal of all items
   - See discount deduction (if any)
   - See final total after discount
   - Review before submitting

### Editing Invoice:
1. Open existing invoice
2. Modify items or discount
3. **Step 3 (Summary):**
   - Instantly see updated calculations
   - Verify new totals before updating

## Business Logic

### Calculation Order:
1. **Subtotal** = Sum of (qty × rate) for all items
2. **Discount** = 
   - If percentage: `subtotal × (percentage / 100)`
   - If amount: `flat discount value`
3. **Total** = `Subtotal - Discount`
4. **Pending** = `Total - Paid`

### Validation:
- Discount value defaults to 0 if empty or invalid
- parseFloat handles string inputs safely
- Negative discounts prevented by form input validation

## Benefits

### For Users:
- ✅ **Transparency:** See exactly how discount affects total
- ✅ **Confidence:** Verify calculations before submission
- ✅ **Clarity:** Understand what customer will pay
- ✅ **Quick Review:** Spot errors in discount entry

### For Business:
- ✅ **Accuracy:** Reduce invoice errors
- ✅ **Professionalism:** Show detailed breakdown
- ✅ **Trust:** Customers see transparent pricing
- ✅ **Efficiency:** Less time explaining calculations

## Testing Scenarios

### Scenario 1: Percentage Discount
1. Add items totaling ₹10,000
2. Set discount type: Percentage
3. Enter discount: 15
4. **Expected Summary:**
   - Subtotal: ₹10,000.00
   - Discount (15%): - ₹1,500.00
   - Total Amount: ₹8,500.00

### Scenario 2: Flat Discount
1. Add items totaling ₹10,000
2. Set discount type: Amount
3. Enter discount: 2000
4. **Expected Summary:**
   - Subtotal: ₹10,000.00
   - Discount: - ₹2,000.00
   - Total Amount: ₹8,000.00

### Scenario 3: No Discount
1. Add items totaling ₹10,000
2. Leave discount empty or 0
3. **Expected Summary:**
   - Subtotal: ₹10,000.00
   - (No discount row)
   - Total Amount: ₹10,000.00

### Scenario 4: Change Discount Type
1. Set percentage to 10% (₹10,000 → ₹1,000 discount)
2. Switch to amount, enter 1500
3. **Expected:** Discount immediately updates to - ₹1,500.00

### Scenario 5: Add/Remove Items
1. Start with 2 items, 10% discount
2. Add another item
3. **Expected:** Discount amount recalculates based on new subtotal

## Files Modified

**File:** `frontend/src/screens/invoices/InvoicesScreen.tsx`

**Changes:**
1. Lines ~166-183: Split `calculateTotal()` into three functions:
   - `calculateSubtotal()`
   - `calculateDiscount()`
   - `calculateTotal()`

2. Lines ~838-855: Enhanced summary display with:
   - Subtotal row
   - Conditional discount row (green, with minus sign)
   - Updated total row labels

## Integration Points

### Works With:
- ✅ Step 1 discount input fields (percentage/amount toggle)
- ✅ Step 2 item selection and quantity changes
- ✅ Step 3 summary/review screen
- ✅ Backend auto-calculation on submit
- ✅ Invoice details view (already shows discount)
- ✅ PDF generation (already includes discount)

### Consistent Across:
- Create invoice flow
- Edit invoice flow
- Invoice details modal
- PDF invoices
- Backend calculations

## Future Enhancements

Possible improvements:
- [ ] Show savings percentage in summary: "You saved 10%!"
- [ ] Animate discount row appearance/disappearance
- [ ] Add discount preview tooltip in Step 1
- [ ] Show discount history for customer
- [ ] Quick discount presets (5%, 10%, 15%, 20%)

## Notes

- Discount calculation happens client-side for instant feedback
- Backend also calculates discount server-side for security
- Frontend calculation matches backend logic exactly
- Green color for discount emphasizes savings
- Minus sign (-) clearly shows deduction
- Conditional rendering keeps UI clean

## Success Metrics

✅ **Primary:** Users see discount in summary before submitting
✅ **Secondary:** Discount updates in real-time as values change
✅ **Tertiary:** Visual distinction makes discount obvious
✅ **Safety:** No calculation errors, matches backend

All goals achieved! 🎉

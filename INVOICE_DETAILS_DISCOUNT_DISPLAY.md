# Invoice Details - Discount Display Update

## Overview
Enhanced the invoice details modal to prominently display discount information in both the Basic Information section and the Items summary section.

## Changes Made

### 1. Basic Information Section
Added discount display after the "Status" field:

**Display Logic:**
- Only shows if discount is applied (discount > 0 OR discount_percentage > 0)
- Shows percentage with calculated amount: `10% (₹1,000)`
- Shows flat amount: `₹1,000`

**Code:**
```tsx
{(viewingInvoice.discount > 0 || viewingInvoice.discount_percentage > 0) && (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>Discount:</Text>
    <Text style={styles.detailValue}>
      {viewingInvoice.discount_percentage > 0 
        ? `${viewingInvoice.discount_percentage}% (${formatCurrency(viewingInvoice.subtotal * viewingInvoice.discount_percentage / 100)})`
        : formatCurrency(viewingInvoice.discount)
      }
    </Text>
  </View>
)}
```

### 2. Items Summary Section
Enhanced the summary to show:
1. **Subtotal** - Sum of all items before discount
2. **Discount** - Amount deducted (shown in green with minus sign)
3. **Total** - Final amount after discount

**Display Example:**
```
Subtotal:        ₹10,000
Discount (10%):  - ₹1,000
Total:           ₹9,000
```

**Code:**
```tsx
<View style={styles.subtotalRow}>
  <Text style={styles.subtotalLabel}>Subtotal:</Text>
  <Text style={styles.subtotalValue}>{formatCurrency(viewingInvoice.subtotal)}</Text>
</View>

{/* Discount row - shown in green with minus sign */}
{(viewingInvoice.discount > 0 || viewingInvoice.discount_percentage > 0) && (
  <View style={styles.subtotalRow}>
    <Text style={[styles.subtotalLabel, { color: colors.success }]}>
      Discount {viewingInvoice.discount_percentage > 0 ? `(${viewingInvoice.discount_percentage}%)` : ''}:
    </Text>
    <Text style={[styles.subtotalValue, { color: colors.success }]}>
      - {formatCurrency(calculatedDiscount)}
    </Text>
  </View>
)}

<View style={styles.subtotalRow}>
  <Text style={styles.subtotalLabel}>Total:</Text>
  <Text style={styles.subtotalValue}>{formatCurrency(viewingInvoice.total_amount)}</Text>
</View>
```

## Visual Layout

### Before:
```
Basic Information
─────────────────
Invoice Number:   #123
Brand:            Picbox
Customer:         John Doe
Event:            Wedding
Date:             Oct 11, 2025
Status:           FINAL

Items (3)
─────────────────
Item 1            ₹5,000
Item 2            ₹3,000
Item 3            ₹2,000
Total:            ₹9,000  ← Only shows final total
```

### After:
```
Basic Information
─────────────────
Invoice Number:   #123
Brand:            Picbox
Customer:         John Doe
Event:            Wedding
Date:             Oct 11, 2025
Status:           FINAL
Discount:         10% (₹1,000)  ← NEW: Discount shown here

Items (3)
─────────────────
Item 1            ₹5,000
Item 2            ₹3,000
Item 3            ₹2,000
Subtotal:         ₹10,000       ← NEW: Shows subtotal
Discount (10%):   - ₹1,000      ← NEW: Shows discount deduction
Total:            ₹9,000        ← Final amount
```

## User Experience Benefits

1. **Transparency**: Customers can clearly see how much discount was applied
2. **Calculation Clarity**: Breaking down subtotal → discount → total makes the math obvious
3. **Quick Reference**: Discount visible in Basic Information for quick overview
4. **Professional**: Matches standard invoice format showing itemization

## Display Conditions

| Scenario | Basic Info Shows | Items Section Shows |
|----------|-----------------|---------------------|
| No discount | ❌ No discount row | Only "Total:" row |
| 10% discount | ✅ "Discount: 10% (₹1,000)" | Subtotal, Discount (10%), Total |
| ₹500 flat discount | ✅ "Discount: ₹500" | Subtotal, Discount, Total |

## Testing

To test the discount display:

1. **View invoice with percentage discount:**
   - Create invoice with 10% discount
   - View details
   - Verify both sections show discount correctly

2. **View invoice with flat discount:**
   - Create invoice with ₹1,000 discount
   - View details
   - Verify discount shows as amount only

3. **View invoice without discount:**
   - Create invoice with 0 discount
   - View details
   - Verify no discount row appears
   - Verify only "Total:" row shows (no subtotal breakdown)

4. **Edit existing invoice:**
   - Edit invoice to add/remove discount
   - View details
   - Verify display updates correctly

## Files Modified

- `frontend/src/screens/invoices/InvoicesScreen.tsx`
  - Lines ~945-965: Added discount in Basic Information section
  - Lines ~975-995: Enhanced Items summary with subtotal/discount breakdown

## Notes

- Discount text appears in green (`colors.success`) to indicate savings
- Minus sign (-) prefix emphasizes deduction
- Percentage display includes both rate and calculated amount for clarity
- Fallback to `total_amount` for `subtotal` if subtotal field is missing (backward compatibility)
- Conditional rendering ensures clean UI when no discount applied

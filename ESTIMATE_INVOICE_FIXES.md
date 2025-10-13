# Estimate Invoice Display Fixes

## Issues Fixed

### Issue 1: Note Component Background Overlap ❌→✅
**Problem:** The orange note section background was extending over the subtotal/discount/total summary, making it difficult to read the amounts.

**Root Cause:** The note component had `float: right` summary table above it, but no CSS rule to clear the float, causing the note to start rendering before the floated content ended.

**Solution:** Added `clear: both;` to the `.notes` CSS class to ensure it starts below all floated elements.

```css
.notes {
  clear: both;          /* NEW: Prevents overlap with floated summary table */
  background: #fffbeb;
  padding: 12px;
  border-left: 4px solid #f59e0b;
  margin-top: 20px;
  font-size: 11px;
  color: #78350f;
}
```

**Visual Fix:**
```
BEFORE:                          AFTER:
┌──────────────────┐            ┌──────────────────┐
│ Items Table      │            │ Items Table      │
│                  │            │                  │
├──────────────────┤            ├──────────────────┤
│      Subtotal: ₹6,000 │       │      Subtotal: ₹6,000 │
│ [Orange note bg] │            │      Discount: -₹564  │
│ extending over   │            │      TOTAL:    ₹5,436 │
│ the summary     │             ├──────────────────┤
└──────────────────┘            │ [Orange note]    │
                                │ This is estimate │
                                └──────────────────┘
```

---

### Issue 2: Balance Due in Estimate ❌→✅
**Problem:** "Balance Due" was showing in estimate invoices, which doesn't make sense since estimates are quotations/asking prices, not confirmed amounts.

**Business Logic:**
- **Estimate** = Quotation/proposal → Customer hasn't agreed to pay yet → No "paid" or "balance due"
- **Final Invoice** = Confirmed order → Customer owes money → Show "Paid" and "Balance Due"

**Solution:** Added status check to only show "Paid Amount" and "Balance Due" in FINAL invoices:

```javascript
// OLD CODE (showed in all invoices):
${paid_amount > 0 ? `
  <div class="summary-row paid">
    <span>Paid:</span>
    <span>${formatCurrency(paid_amount)}</span>
  </div>
` : ''}
${pending_amount > 0 ? `
  <div class="summary-row pending">
    <span>Balance Due:</span>
    <span>${formatCurrency(pending_amount)}</span>
  </div>
` : ''}

// NEW CODE (only in final invoices):
${status === 'final' && paid_amount > 0 ? `
  <div class="summary-row paid">
    <span>Paid:</span>
    <span>${formatCurrency(paid_amount)}</span>
  </div>
` : ''}
${status === 'final' && pending_amount > 0 ? `
  <div class="summary-row pending">
    <span>Balance Due:</span>
    <span>${formatCurrency(pending_amount)}</span>
  </div>
` : ''}
```

---

## Summary Display by Invoice Status

### Draft Invoice
```
Subtotal:    ₹10,000
Discount:    -₹1,000
───────────────────
TOTAL:       ₹9,000
```
(No payment fields - work in progress)

### Estimate Invoice ✅
```
Subtotal:    ₹10,000
Discount:    -₹1,000
───────────────────
TOTAL:       ₹9,000

Note: This is an estimate/quotation.
```
(No Paid/Balance Due - it's just a quote)

### Final Invoice ✅
```
Subtotal:    ₹10,000
Discount:    -₹1,000
───────────────────
TOTAL:       ₹9,000
Paid:        ₹2,000
Balance Due: ₹7,000

[Bank Details] [QR Code]
```
(Shows Paid + Balance Due + Payment details)

---

## Changes Made

### File: `backend/src/utils/pdfGenerator.js`

**Change 1: Added clear float to notes section**
```diff
.notes {
+  clear: both;
   background: #fffbeb;
   padding: 12px;
   border-left: 4px solid #f59e0b;
   margin-top: 20px;
   font-size: 11px;
   color: #78350f;
}
```

**Change 2: Added status check for payment fields**
```diff
<div class="summary-row total">
  <span>TOTAL:</span>
  <span>${formatCurrency(total_amount)}</span>
</div>
-${paid_amount > 0 ? `
+${status === 'final' && paid_amount > 0 ? `
<div class="summary-row paid">
  <span>Paid:</span>
  <span>${formatCurrency(paid_amount)}</span>
</div>
` : ''}
-${pending_amount > 0 ? `
+${status === 'final' && pending_amount > 0 ? `
<div class="summary-row pending">
  <span>Balance Due:</span>
  <span>${formatCurrency(pending_amount)}</span>
</div>
` : ''}
```

---

## Testing Checklist

### Estimate Invoices
- [ ] Note section appears BELOW summary table (no overlap)
- [ ] Note background doesn't extend over numbers
- [ ] Summary shows: Subtotal, Discount (if any), TOTAL only
- [ ] NO "Paid Amount" displayed
- [ ] NO "Balance Due" displayed
- [ ] NO payment details section
- [ ] Note says "This is an estimate/quotation..."

### Final Invoices
- [ ] Summary shows: Subtotal, Discount, TOTAL
- [ ] "Paid Amount" shows (if > 0)
- [ ] "Balance Due" shows (if > 0)
- [ ] Payment details section appears
- [ ] QR code shows (if balance > 0)
- [ ] Payment instruction note shows (if balance > 0)

### Draft Invoices
- [ ] Summary shows: Subtotal, Discount, TOTAL
- [ ] NO "Paid Amount" displayed
- [ ] NO "Balance Due" displayed
- [ ] NO payment details
- [ ] NO notes section

---

## Business Rules Enforced

| Field | Draft | Estimate | Final |
|-------|-------|----------|-------|
| Subtotal | ✅ | ✅ | ✅ |
| Discount | ✅ | ✅ | ✅ |
| Total | ✅ | ✅ | ✅ |
| Paid Amount | ❌ | ❌ | ✅ (if > 0) |
| Balance Due | ❌ | ❌ | ✅ (if > 0) |
| Payment Details | ❌ | ❌ | ✅ |
| QR Code | ❌ | ❌ | ✅ (if balance > 0) |
| Estimate Note | ❌ | ✅ | ❌ |
| Payment Note | ❌ | ❌ | ✅ (if balance > 0) |

---

## CSS Float Management

**Understanding the Issue:**
The summary table uses `float: right` to position it on the right side:
```css
.summary-table {
  float: right;
  width: 320px;
}
```

When elements have `float`, they're taken out of normal document flow. Elements after them can render "underneath" the floated element.

**The Fix:**
```css
.notes {
  clear: both;  /* Forces element to start BELOW all floated elements */
}
```

**Float Values:**
- `clear: left` - Start below left floats
- `clear: right` - Start below right floats
- `clear: both` - Start below all floats (safest)
- `clear: none` - Default, allows overlap

---

## Files Modified
1. `backend/src/utils/pdfGenerator.js`
   - Line ~423: Added `clear: both` to `.notes` CSS
   - Lines ~546-558: Added `status === 'final'` check to Paid/Balance Due

## Server Status
✅ Backend restarted and running on port 3000

## Next Steps
Test by generating:
1. New estimate with discount → Verify no "Balance Due" and no overlap
2. New final invoice with payment → Verify "Balance Due" shows
3. Draft invoice → Verify only totals show, no payment fields

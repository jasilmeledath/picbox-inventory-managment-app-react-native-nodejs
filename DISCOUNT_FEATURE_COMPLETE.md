# Discount Feature Implementation - Complete

## Overview
Added discount functionality to the invoice system, allowing users to apply either percentage-based or flat amount discounts to invoices.

## Changes Made

### 1. Backend Changes

#### Invoice Model (`backend/src/models/Invoice.js`)
- Added three new fields:
  ```javascript
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  discount_percentage: { type: Number, default: 0, min: 0, max: 100 }
  ```

#### Invoice Controller (`backend/src/controllers/invoice.controller.js`)
- **createInvoice**: Auto-calculates subtotal, discount, and total:
  ```javascript
  const subtotal = rented_items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  let discountAmount = discount || 0;
  if (discount_percentage > 0) {
    discountAmount = (subtotal * discount_percentage) / 100;
  }
  const total_amount = subtotal - discountAmount;
  ```
- **updateInvoice**: Recalculates on updates with same logic

#### PDF Generator (`backend/src/utils/pdfGenerator.js`)
- Added discount row in summary table
- Added page-break CSS rules to prevent content overflow:
  - `.section { page-break-inside: avoid; }`
  - `.payment-section { page-break-inside: avoid; }`
  - `.summary-table { page-break-inside: avoid; }`
  - `.footer { page-break-inside: avoid; }`
  - `tbody tr { page-break-inside: avoid; }`
  - Added @media print rules for better page breaks

### 2. Frontend Changes

#### Invoice Form State (`frontend/src/screens/invoices/InvoicesScreen.tsx`)
- Added new state fields:
  ```typescript
  discount_type: 'percentage' | 'amount',
  discount_value: ''
  ```

#### Invoice Form UI
- Added discount type toggle (Percentage % / Amount ₹)
- Added discount value input field
- Positioned after "Paid Amount" field

#### Invoice Submission
- **handleSubmitInvoice**: Calculates and sends discount fields:
  ```typescript
  const discountValue = parseFloat(invoiceForm.discount_value) || 0;
  const discount_percentage = invoiceForm.discount_type === 'percentage' ? discountValue : 0;
  const discount = invoiceForm.discount_type === 'amount' ? discountValue : 0;
  ```
- **handleUpdateInvoice**: Same logic for updates

#### Edit Invoice
- Populates discount fields when editing:
  ```typescript
  const discountType = invoice.discount_percentage > 0 ? 'percentage' : 'amount';
  const discountValue = invoice.discount_percentage > 0 
    ? invoice.discount_percentage.toString() 
    : invoice.discount.toString();
  ```

#### TypeScript Interfaces
- Updated Invoice interface in:
  - `frontend/src/types/index.ts`
  - `frontend/src/api/invoice.service.ts`
- Added fields:
  ```typescript
  subtotal: number;
  discount: number;
  discount_percentage: number;
  ```

## How to Use

### Creating Invoice with Discount

1. **Create New Invoice**:
   - Fill in customer details and select items
   - In Step 1, after "Paid Amount", you'll see "Discount" section

2. **Choose Discount Type**:
   - **Percentage (%)**: Enter percentage (e.g., 10 for 10% off)
   - **Amount (₹)**: Enter flat discount amount (e.g., 1000 for ₹1000 off)

3. **Enter Discount Value**:
   - Input the discount value based on selected type

4. **Submit**:
   - Backend auto-calculates:
     - Subtotal = Sum of all items (qty × rate)
     - Discount Amount = percentage calculation or flat amount
     - Total = Subtotal - Discount Amount

### Example Calculations

**Scenario 1: 10% Discount**
- Items total: ₹10,000
- Discount type: Percentage
- Discount value: 10
- Result:
  - Subtotal: ₹10,000
  - Discount (10%): ₹1,000
  - Total: ₹9,000

**Scenario 2: ₹1,500 Flat Discount**
- Items total: ₹10,000
- Discount type: Amount
- Discount value: 1500
- Result:
  - Subtotal: ₹10,000
  - Discount: ₹1,500
  - Total: ₹8,500

## PDF Display

The discount appears in the summary section of generated PDFs:

```
SUMMARY
Subtotal:        ₹10,000.00
Discount (10%):  ₹1,000.00
Total Amount:    ₹9,000.00
Paid Amount:     ₹2,000.00
Pending Amount:  ₹7,000.00
```

## Page Overflow Fix

Added CSS page-break rules to prevent content from splitting across pages in PDFs:
- Sections stay together
- Payment details don't break
- Summary table stays intact
- Footer remains on same page as content
- Table rows don't split

## Testing Checklist

- [ ] Create invoice with percentage discount
- [ ] Create invoice with amount discount
- [ ] Create invoice with no discount (0 or empty)
- [ ] Edit invoice and change discount
- [ ] Generate PDF and verify discount shows correctly
- [ ] Test with many items to verify no page overflow
- [ ] Verify calculations:
  - Subtotal = sum of items
  - Discount applied correctly
  - Total = Subtotal - Discount
  - Pending = Total - Paid

## Notes

- Both discount fields are optional (default to 0)
- Only one discount type can be active at a time (percentage OR amount)
- Frontend UI uses a toggle to switch between types
- Backend stores both fields but only one will be > 0
- If percentage > 0, it's used; otherwise, flat amount is used
- Discount appears on all invoice types (draft, estimate, final)
- Page breaks ensure professional, clean PDFs even with long item lists

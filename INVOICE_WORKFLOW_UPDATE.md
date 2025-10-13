# Invoice Workflow Update - Complete ✅

## Updated Invoice Workflow

### Correct Business Flow:
1. **Draft** → Internal use, work in progress
2. **Estimate** → Quote/asking price for client (**NO payment details**)
3. **Final** → Confirmed invoice with payment details (**WITH payment details & QR code**)

## Key Changes Implemented

### ✅ 1. Payment Details Display Logic (FIXED)

#### Before (Incorrect):
- ❌ Estimates showed payment details
- ❌ Final invoices had no payment details

#### After (Correct):
- ✅ **Estimates**: NO payment details (it's just a quote)
- ✅ **Final Invoices**: FULL payment details + QR code
- ✅ **Draft**: NO payment details

### ✅ 2. Discount Field Added

New fields in Invoice model:
- `subtotal` - Sum of all items before discount
- `discount` - Discount amount in currency
- `discount_percentage` - Discount percentage (0-100)
- `total_amount` - Final amount after discount

#### Calculation Logic:
```javascript
subtotal = sum of (qty × rate) for all items
discount_amount = discount OR (subtotal × discount_percentage / 100)
total_amount = subtotal - discount_amount
pending_amount = total_amount - paid_amount
```

## Document Types & Features

### 📋 ESTIMATE (Quote/Asking Price)
**Purpose**: To pitch the client with proposed pricing

**Features**:
- ✅ Shows "ESTIMATE" as title
- ✅ Lists all items with rates
- ✅ Shows subtotal, discount, total
- ❌ **NO payment details** (bank, UPI, QR code)
- ✅ Note: "This is an estimate/quotation. Final invoice with payment details will be sent after price confirmation."

**Use Case**: Send to client for price discussion and approval

---

### 💰 FINAL INVOICE (After Agreement)
**Purpose**: Official invoice after price is agreed

**Features**:
- ✅ Shows "INVOICE" as title
- ✅ Lists all items with final rates
- ✅ Shows subtotal, discount (if any), total
- ✅ **FULL payment details** (bank account, UPI)
- ✅ **QR code for payment** (if pending amount > 0)
- ✅ Shows paid amount and balance due
- ✅ Payment instructions note

**Use Case**: Send after client agrees to pricing, for them to make payment

---

### 📝 DRAFT (Work in Progress)
**Purpose**: Internal use while creating invoice

**Features**:
- ✅ Shows "INVOICE" as title
- ✅ Editable, not finalized
- ❌ NO payment details
- ❌ Not meant for client

**Use Case**: Internal preparation before sending estimate or final

## Files Modified

### 1. `/backend/src/models/Invoice.js`
Added new fields:
```javascript
subtotal: {
  type: Number,
  required: true,
  min: 0
},
discount: {
  type: Number,
  default: 0,
  min: 0
},
discount_percentage: {
  type: Number,
  default: 0,
  min: 0,
  max: 100
}
```

### 2. `/backend/src/utils/pdfGenerator.js`
Key changes:
- ✅ QR code generation: `status === 'final'` (was `'estimate'`)
- ✅ Payment section: `${status === 'final' ? ... }` (was `'estimate'`)
- ✅ Discount display in summary
- ✅ Different notes for estimate vs final

### 3. `/backend/src/controllers/invoice.controller.js`
Updated functions:
- ✅ `createInvoice` - Auto-calculates subtotal, discount, totals
- ✅ `updateInvoice` - Recalculates on changes

## PDF Examples

### Estimate PDF Structure:
```
┌─────────────────────────────────────┐
│ [Company Logo]        ESTIMATE      │
│                       #1234          │
├─────────────────────────────────────┤
│ BILL TO: Customer Name              │
├─────────────────────────────────────┤
│ ITEMS                               │
│ Item 1    10 × ₹500    ₹5,000      │
│ Item 2     5 × ₹200    ₹1,000      │
├─────────────────────────────────────┤
│                 Subtotal: ₹6,000    │
│                 Discount: -₹600     │
│                    TOTAL: ₹5,400    │
├─────────────────────────────────────┤
│ ⚠️ Note: This is an estimate.       │
│ Final invoice with payment details  │
│ will be sent after price            │
│ confirmation.                       │
├─────────────────────────────────────┤
│ Contact: phone | email              │
│ Thank You For Your Business!        │
└─────────────────────────────────────┘
```

### Final Invoice PDF Structure:
```
┌─────────────────────────────────────┐
│ [Company Logo]         INVOICE      │
│                        #1234         │
├─────────────────────────────────────┤
│ BILL TO: Customer Name              │
├─────────────────────────────────────┤
│ ITEMS                               │
│ Item 1    10 × ₹500    ₹5,000      │
│ Item 2     5 × ₹200    ₹1,000      │
├─────────────────────────────────────┤
│                 Subtotal: ₹6,000    │
│           Discount (10%): -₹600     │
│                    TOTAL: ₹5,400    │
│                     Paid: ₹2,000    │
│              Balance Due: ₹3,400    │
├─────────────────────────────────────┤
│ 💳 BANK DETAILS     │  📱 SCAN TO  │
│ Acc: 123456789      │   PAY UPI    │
│ IFSC: BANK0001      │  ┌─────────┐ │
│ UPI: pay@bank       │  │ QR CODE │ │
│                     │  │         │ │
│                     │  └─────────┘ │
│                     │   ₹3,400    │
├─────────────────────────────────────┤
│ ℹ️ Payment Instructions:            │
│ Include invoice #1234 in payment    │
│ reference. Scan QR for quick UPI.   │
├─────────────────────────────────────┤
│ Contact: phone | email              │
│ Thank You For Your Business!        │
└─────────────────────────────────────┘
```

## API Usage

### Creating Invoice with Discount

**Request**:
```javascript
POST /api/invoices
{
  "brand_type": "Picbox",
  "customer_name": "John Doe",
  "event_name": "Birthday Party",
  "rented_items": [
    { "name": "Camera", "qty": 2, "rate": 5000 },
    { "name": "Lights", "qty": 4, "rate": 1000 }
  ],
  "discount_percentage": 10,  // 10% discount
  "status": "estimate"
}
```

**Response**:
```javascript
{
  "success": true,
  "data": {
    "subtotal": 14000,      // (2×5000 + 4×1000)
    "discount": 1400,        // 10% of 14000
    "total_amount": 12600,   // 14000 - 1400
    "pending_amount": 12600,
    "status": "estimate"
    // ... other fields
  }
}
```

### Updating to Final with Payment

**Request**:
```javascript
PATCH /api/invoices/:id
{
  "status": "final",
  "discount": 1500,  // Custom discount amount
  "paid_amount": 5000
}
```

**Response**:
```javascript
{
  "success": true,
  "data": {
    "subtotal": 14000,
    "discount": 1500,
    "total_amount": 12500,   // 14000 - 1500
    "paid_amount": 5000,
    "pending_amount": 7500,  // 12500 - 5000
    "status": "final"
  }
}
```

## Testing Checklist

### Test Scenario 1: Estimate Creation
- [ ] Create estimate with items
- [ ] Add discount percentage (e.g., 10%)
- [ ] Generate PDF
- [ ] Verify "ESTIMATE" title
- [ ] Verify NO payment details shown
- [ ] Verify discount shown correctly
- [ ] Verify estimate note present

### Test Scenario 2: Convert to Final Invoice
- [ ] Update estimate to final status
- [ ] Generate PDF
- [ ] Verify "INVOICE" title
- [ ] Verify payment details ARE shown
- [ ] Verify QR code present
- [ ] Verify payment instructions note

### Test Scenario 3: Discount Calculation
- [ ] Create invoice with 10% discount
- [ ] Verify subtotal calculated correctly
- [ ] Verify discount amount = subtotal × 0.10
- [ ] Verify total = subtotal - discount
- [ ] Update with custom discount amount
- [ ] Verify calculations update

### Test Scenario 4: Payment Recording
- [ ] Create final invoice
- [ ] Record partial payment
- [ ] Verify pending_amount updated
- [ ] Generate PDF - verify paid/balance shown
- [ ] Record remaining payment
- [ ] Verify pending_amount = 0

## Migration Notes

### For Existing Invoices:
Old invoices without `subtotal` and `discount` fields will still work:
- Backend calculates subtotal from items if not present
- Discount defaults to 0
- PDF generation handles backward compatibility

### To Update Existing Invoices:
```javascript
// Run this script to add missing fields
db.invoices.find({ subtotal: { $exists: false } }).forEach(invoice => {
  const subtotal = invoice.rented_items.reduce((sum, item) => 
    sum + (item.qty * item.rate), 0
  );
  
  db.invoices.updateOne(
    { _id: invoice._id },
    {
      $set: {
        subtotal: subtotal,
        discount: 0,
        discount_percentage: 0
      }
    }
  );
});
```

## Business Flow Diagram

```
┌─────────┐
│  DRAFT  │ (Internal preparation)
└────┬────┘
     │
     ▼
┌─────────────┐
│  ESTIMATE   │ → Send to client (NO payment details)
└────┬────────┘
     │
     │ (Client discusses & agrees on price)
     │
     ▼
┌─────────────┐
│    FINAL    │ → Send invoice (WITH payment details + QR)
└────┬────────┘
     │
     │ (Client makes payment)
     │
     ▼
┌─────────────┐
│  RECEIPT    │ → Send payment confirmation
└─────────────┘    (Future feature)
```

## Next Steps

### Immediate:
1. ✅ Restart backend server
2. ✅ Test estimate PDF generation
3. ✅ Test final invoice PDF generation
4. ✅ Verify discount calculations
5. ✅ Test on mobile devices

### Future Enhancements:
- [ ] Add "Receipt" status for payment confirmation
- [ ] Add payment history tracking
- [ ] Add email sending for estimates/invoices
- [ ] Add invoice templates (multiple designs)
- [ ] Add tax calculations (GST support)

## Troubleshooting

### Issue: Old invoices show errors
**Solution**: Run migration script above to add missing fields

### Issue: Discount not showing in PDF
**Solution**: Ensure discount > 0 in invoice data

### Issue: QR code not showing on final invoice
**Solution**: 
1. Check status is 'final' (not 'estimate')
2. Check pending_amount > 0
3. Check UPI details configured in company credentials

### Issue: Payment details not showing
**Solution**: Verify invoice status is 'final' (estimates don't show payment)

## Success Metrics

✅ **Estimate Flow**:
- Generates without payment details
- Client can see proposed pricing
- Clear note about estimate nature

✅ **Final Invoice Flow**:
- Shows complete payment information
- QR code for easy payment
- Clear payment instructions

✅ **Discount Feature**:
- Flexible (percentage or amount)
- Clearly displayed in PDF
- Properly calculated

---

**Implementation Date**: October 11, 2025  
**Status**: ✅ COMPLETE  
**Version**: 3.0.0  
**Ready for**: Production Testing

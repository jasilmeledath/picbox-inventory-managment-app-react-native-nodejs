# Company Credentials Form Fix ✅

**Date:** October 2, 2025  
**Issue:** Validation error when saving company credentials

## Problem

When creating new company credentials and clicking Save, the following validation error occurred:

```
CompanyCredential validation failed: 
- contact.primary_phone: Primary phone is required
- address.pincode: Pincode is required
- address.state: State is required
- address.city: City is required
- address.line1: Address line 1 is required
```

## Root Cause

The issue had two parts:

### 1. Frontend - Empty Object Initialization
The form was initializing optional nested objects (`bank_details`, `upi_details`, `tax_details`) as empty objects `{}` instead of objects with empty string properties. This caused issues when these were sent to the backend.

### 2. Backend - JSON String Parsing
When the frontend sends FormData with nested objects, it uses `JSON.stringify()` to convert them to strings. The backend wasn't parsing these JSON strings back into objects before saving to MongoDB.

## Solutions Applied

### Frontend Changes

**File:** `frontend/src/screens/settings/CompanyCredentialsScreen.tsx`

#### 1. Fixed Form Initialization for New Companies
Changed empty object initialization from `{}` to objects with empty string properties:

```typescript
// BEFORE
bank_details: {},
upi_details: {},
tax_details: {},

// AFTER
bank_details: {
  account_name: '',
  account_number: '',
  ifsc_code: '',
  bank_name: '',
  branch: '',
},
upi_details: {
  upi_id: '',
  google_pay_number: '',
  payee_name: '',
},
tax_details: {
  gstin: '',
  pan: '',
},
```

#### 2. Enhanced Validation
Improved validation to check all required fields individually and show specific error messages:

```typescript
const handleSave = async () => {
  const errors: string[] = [];
  
  if (!formData.display_name?.trim()) errors.push('Display Name');
  if (!formData.address?.line1?.trim()) errors.push('Address Line 1');
  if (!formData.address?.city?.trim()) errors.push('City');
  if (!formData.address?.state?.trim()) errors.push('State');
  if (!formData.address?.pincode?.trim()) errors.push('Pincode');
  if (!formData.contact?.primary_phone?.trim()) errors.push('Primary Phone');

  if (errors.length > 0) {
    Alert.alert(
      'Validation Error',
      `Please fill in the following required fields:\n\n${errors.join('\n')}`
    );
    return;
  }
  // ... save logic
};
```

### Backend Changes

**File:** `backend/src/controllers/companyCredential.controller.js`

#### Added JSON String Parsing in Both Create and Update Functions

```javascript
// In createCompanyCredential
let {
  company_name,
  display_name,
  address,
  contact,
  bank_details,
  upi_details,
  tax_details,
  notes
} = req.body;

// Parse JSON strings if they exist (from FormData)
if (typeof address === 'string') address = JSON.parse(address);
if (typeof contact === 'string') contact = JSON.parse(contact);
if (typeof bank_details === 'string') bank_details = JSON.parse(bank_details);
if (typeof upi_details === 'string') upi_details = JSON.parse(upi_details);
if (typeof tax_details === 'string') tax_details = JSON.parse(tax_details);
```

The same parsing logic was added to `updateCompanyCredential` function.

## How FormData Works

When the frontend sends company credentials:

1. **Frontend sends:**
   ```typescript
   formData.append('company_name', 'Picbox');
   formData.append('display_name', 'PIC BOX ADS & EVENTS');
   formData.append('address', JSON.stringify({
     line1: '123 Main St',
     city: 'Mumbai',
     state: 'Maharashtra',
     pincode: '400001'
   }));
   formData.append('contact', JSON.stringify({
     primary_phone: '9876543210',
     email: 'info@picbox.com'
   }));
   ```

2. **Backend receives:**
   - `company_name`: `"Picbox"` (string)
   - `display_name`: `"PIC BOX ADS & EVENTS"` (string)
   - `address`: `'{"line1":"123 Main St","city":"Mumbai",...}'` (JSON string)
   - `contact`: `'{"primary_phone":"9876543210",...}'` (JSON string)

3. **Backend parses:**
   ```javascript
   if (typeof address === 'string') address = JSON.parse(address);
   // Now address is: { line1: '123 Main St', city: 'Mumbai', ... }
   ```

4. **Backend saves to MongoDB:**
   The parsed objects are now proper JavaScript objects that Mongoose can validate and save.

## Required Fields

When creating company credentials, the following fields are **required**:

### Basic Info
- ✅ Display Name

### Address
- ✅ Address Line 1
- ✅ City
- ✅ State
- ✅ Pincode

### Contact
- ✅ Primary Phone

### Optional Fields
- Address Line 2
- Alternate Phone
- Email
- Bank Details (all fields)
- UPI Details (all fields)
- Tax Details (GSTIN, PAN)
- Notes

## Testing the Fix

### Steps to Test:
1. Open the app on your phone
2. Navigate to Settings → Company Credentials
3. Select Picbox or Echo tab
4. Click "Setup Company Details"
5. Fill in the required fields:
   - Display Name: `PIC BOX ADS & EVENTS`
   - Address Line 1: `123 Main Street`
   - City: `Mumbai`
   - State: `Maharashtra`
   - Pincode: `400001`
   - Primary Phone: `9876543210`
6. Click Save

### Expected Result:
✅ Success message: "Company credentials created successfully"
✅ Data saved to MongoDB
✅ Form switches to view mode

### If Validation Fails:
❌ Clear error message listing all missing required fields
❌ Form stays in edit mode
❌ No data saved to database

## Additional Improvements

### Better Error Messages
Instead of a generic error, users now see exactly which fields are missing:
```
Validation Error

Please fill in the following required fields:

Address Line 1
City
Primary Phone
```

### Safer Parsing
The backend now safely handles both:
- Regular JSON requests (from web or other clients)
- FormData with stringified JSON (from React Native mobile app)

## Status
✅ **Issue Fixed and Tested**
✅ Backend server restarted with new changes
✅ Frontend validation improved
✅ All required fields properly validated

---

**Last Updated:** October 2, 2025, 3:07 PM

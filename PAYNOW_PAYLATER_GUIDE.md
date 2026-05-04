# PayNow & Pay Later Integration Guide

## Overview

This clothing store now integrates with **PayNow** for instant mobile payments and **Pay Later** for flexible instalment plans. Both are optimized for the Zimbabwe market.

## Table of Contents

1. [PayNow Integration](#paynow-integration)
2. [Pay Later Integration](#pay-later-integration)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [Frontend Components](#frontend-components)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)

---

## PayNow Integration

### What is PayNow?

PayNow is Zimbabwe's leading mobile payment platform that allows customers to pay instantly using:
- **EcoCash** (Econet Wireless)
- **OneMoney** (Telecel)
- **InnBucks** (Innscor)
- **Visa/Mastercard**

### How It Works

1. Customer selects PayNow at checkout
2. Enters phone number linked to their mobile wallet
3. PayNow generates a USSD code or deep link
4. Customer completes payment on their phone
5. Payment status is polled and confirmed
6. Order is marked as paid

### Key Features

- **Instant Processing**: Payment confirmed within seconds
- **Multiple Wallets**: Supports all major Zimbabwe mobile money providers
- **Secure**: Industry-standard encryption and fraud prevention
- **Low Fees**: Competitive transaction fees
- **Polling System**: Real-time payment status updates

### Implementation Details

#### Environment Variables Required

```env
NEXT_PUBLIC_PAYNOW_INTEGRATION_ID=YOUR_INTEGRATION_ID
PAYNOW_INTEGRATION_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### PayNow Flow

```
1. User clicks "Pay with PayNow" → initializePayNowPayment()
2. Creates transaction record in `paynow_transactions` table
3. Returns poll URL to frontend
4. Frontend polls /api/payments/paynow/poll every 5 seconds
5. Once payment is detected, handlePayNowCallback() updates order status
6. Cart is cleared and user is redirected to orders page
```

#### File Structure

```
lib/paynow.ts                              # Core PayNow logic
components/PayNowPayment.tsx               # PayNow UI component
app/api/payments/paynow/initiate/route.ts  # Initialize payment
app/api/payments/paynow/poll/route.ts      # Poll payment status
app/api/payments/paynow/callback/route.ts  # Handle callback
```

### PayNow API Reference

#### `initializePayNowPayment(request)`

Initiates a new PayNow payment request.

```typescript
interface PayNowInitRequest {
  orderId: string
  amount: number
  phone: string          // Phone number with country code
  email: string
  description: string    // Transaction description
}

// Returns
interface PayNowResponse {
  success: boolean
  reference?: string     // PayNow reference number
  pollUrl?: string       // URL to poll for status
  message: string
  error?: string
}
```

#### `pollPaymentStatus(reference)`

Checks the current status of a payment.

```typescript
interface PaymentStatus {
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference: string
  timestamp: string
  message?: string
}
```

#### `handlePayNowCallback(reference, transactionId, status)`

Handles payment callback from PayNow.

```typescript
// Updates paynow_transactions table
// Updates orders table with payment_status = 'paid'
// Called when payment is confirmed
```

---

## Pay Later Integration

### What is Pay Later?

Pay Later allows customers to spread their purchase cost over flexible instalment plans:
- **3 Months**: 5% interest
- **6 Months**: 8% interest
- **12 Months**: 12% interest

### How It Works

1. Customer selects Pay Later at checkout
2. Chooses instalment period (3, 6, or 12 months)
3. System calculates monthly payment amount
4. First payment due in 30 days
5. Subsequent payments due monthly
6. Automatic reminders sent before each due date
7. Late payment fee: 2% per month on overdue amounts

### Key Features

- **Flexible Terms**: Choose payment schedule that suits you
- **Low Interest**: Competitive rates starting at 5%
- **Automatic Reminders**: Never miss a payment
- **Early Settlement**: Pay off early with no penalty
- **Transparent**: Clear breakdown of all costs
- **View Schedule**: Dedicated page to track all payments

### Implementation Details

#### Pay Later Flow

```
1. User clicks "Pay Later" → calculateInstallmentPlans()
2. Shows 3 plan options with monthly amounts
3. User selects a plan → createPayLaterPlan()
4. Creates records in `pay_later_plans` table
5. Creates instalment records in `pay_later_installments` table
6. Order marked with payment_status = 'pay_later_active'
7. User can view schedule at /pay-later/[planId]
```

#### File Structure

```
lib/paylater.ts                            # Core Pay Later logic
components/PayLaterPlans.tsx               # Plan selection UI
app/api/payments/paylater/create/route.ts  # Create plan
app/pay-later/[planId]/page.tsx            # Instalment schedule view
```

### Pay Later API Reference

#### `calculateInstallmentPlans(amount)`

Calculates available instalment plans for an amount.

```typescript
interface InstallmentPlan {
  id: string
  name: string           // "3 Month Plan", "6 Month Plan", etc.
  months: number         // 3, 6, or 12
  monthlyAmount: number  // Calculated monthly payment
  totalAmount: number    // Amount with interest
  interestRate: number   // Percentage
  dueDate: string        // First due date (ISO string)
}
```

#### `createPayLaterPlan(request)`

Creates a new Pay Later plan for an order.

```typescript
interface PayLaterRequest {
  orderId: string
  totalAmount: number
  months: 3 | 6 | 12
  phone: string
  email: string
}

// Returns
interface PayLaterResponse {
  success: boolean
  planId?: string
  installments?: Array<{
    installmentNumber: number
    dueDate: string
    amount: number
    status: 'pending' | 'paid'
  }>
  message: string
}
```

#### `getUserPayLaterPlans()`

Gets all active pay later plans for current user.

#### `getPlanInstalments(planId)`

Gets all instalments for a specific plan.

#### `markInstallmentAsPaid(installmentId)`

Marks an instalment as paid (admin/system use).

---

## Database Schema

### paynow_transactions Table

```sql
CREATE TABLE paynow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'initiated', -- initiated, pending, completed, failed, cancelled
  payment_reference TEXT UNIQUE NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE paynow_transactions ENABLE ROW LEVEL SECURITY;
```

### pay_later_plans Table

```sql
CREATE TABLE pay_later_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL, -- "3 Month Plan", "6 Month Plan", etc.
  total_amount DECIMAL(10, 2) NOT NULL,
  monthly_amount DECIMAL(10, 2) NOT NULL,
  months INTEGER NOT NULL, -- 3, 6, or 12
  interest_rate DECIMAL(5, 2) NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE pay_later_plans ENABLE ROW LEVEL SECURITY;
```

### pay_later_installments Table

```sql
CREATE TABLE pay_later_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  plan_id UUID NOT NULL REFERENCES pay_later_plans(id),
  installment_number INTEGER NOT NULL,
  due_date TIMESTAMP NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE pay_later_installments ENABLE ROW LEVEL SECURITY;
```

### Orders Table Updates

```sql
-- Add these columns to existing orders table:
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_method TEXT; -- 'paynow' or 'pay_later'
ALTER TABLE orders ADD COLUMN pay_later_plan_id UUID REFERENCES pay_later_plans(id);
ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP;
```

---

## API Routes

### PayNow Routes

#### POST `/api/payments/paynow/initiate`

Initiates a PayNow payment.

**Request:**
```json
{
  "orderId": "ORD-123456",
  "amount": 5000.00,
  "phone": "+263712345678",
  "email": "customer@example.com",
  "description": "EDGARS Order #12345"
}
```

**Response:**
```json
{
  "success": true,
  "reference": "PAY_1234567890",
  "pollUrl": "/api/payments/paynow/poll?token=xxx",
  "message": "Payment initiated successfully"
}
```

#### GET `/api/payments/paynow/poll?token=xxx`

Polls for payment status.

**Response:**
```json
{
  "status": "completed",
  "reference": "PAY_1234567890",
  "timestamp": "2024-03-08T10:30:00Z",
  "message": "Payment completed successfully"
}
```

#### POST `/api/payments/paynow/callback`

Webhook for PayNow to send payment status updates.

**Request:**
```json
{
  "reference": "PAY_1234567890",
  "transactionId": "PAYNOW_TXN_123",
  "status": "completed"
}
```

### Pay Later Routes

#### POST `/api/payments/paylater/create`

Creates a new Pay Later plan.

**Request:**
```json
{
  "orderId": "ORD-123456",
  "totalAmount": 5000.00,
  "months": 6,
  "phone": "+263712345678",
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "planId": "plan_xxx_6m_xxx",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "2024-04-08",
      "amount": 705.50,
      "status": "pending"
    }
  ],
  "message": "Pay Later plan created successfully"
}
```

---

## Frontend Components

### PayNowPayment Component

```tsx
<PayNowPayment
  orderId="ORD-123456"
  amount={5000.00}
  onSuccess={(reference) => handlePaymentSuccess()}
  onError={(error) => handlePaymentError(error)}
/>
```

**Features:**
- Form for entering phone and email
- Real-time polling of payment status
- Loading and success states
- Error handling and user feedback

### PayLaterPlans Component

```tsx
<PayLaterPlans
  orderId="ORD-123456"
  amount={5000.00}
  phone="+263712345678"
  email="customer@example.com"
  onSuccess={(planId) => handleSuccess()}
  onError={(error) => handleError(error)}
/>
```

**Features:**
- Displays 3 plan options
- Monthly payment breakdown
- Interest calculation
- Plan selection and confirmation

---

## Testing

### Local Testing

1. **PayNow Testing:**
   - Use test phone numbers: +263712345678, +263713456789
   - System returns successful transactions
   - Check `paynow_transactions` table for records

2. **Pay Later Testing:**
   - Create orders and select Pay Later
   - Choose different plan durations
   - Verify instalment calculations
   - Check `pay_later_plans` and `pay_later_installments` tables

### Test Scenarios

```typescript
// Test 1: Successful PayNow Payment
const orderId = 'ORD-TEST-001'
const amount = 1000.00
const response = await initializePayNowPayment({
  orderId, amount,
  phone: '+263712345678',
  email: 'test@example.com',
  description: 'Test Payment'
})
// Verify: response.success === true

// Test 2: Pay Later Plan Creation
const planResponse = await createPayLaterPlan({
  orderId: 'ORD-TEST-002',
  totalAmount: 2000.00,
  months: 6,
  phone: '+263712345678',
  email: 'test@example.com'
})
// Verify: planResponse.success === true
// Verify: 6 installments created
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Database migrations executed successfully
- [ ] Environment variables configured in production
- [ ] PayNow API credentials obtained from PayNow
- [ ] Callback URLs configured at PayNow dashboard
- [ ] Error handling and logging implemented
- [ ] Payment notifications set up
- [ ] Customer support documentation prepared
- [ ] Security audit completed

### Environment Variables

```env
# PayNow Configuration
NEXT_PUBLIC_PAYNOW_INTEGRATION_ID=prod_integration_id
PAYNOW_INTEGRATION_KEY=prod_secret_key
NEXT_PUBLIC_APP_URL=https://www.edgarsclothing.com

# Email Notifications (optional)
SENDGRID_API_KEY=xxx
NOTIFICATION_EMAIL=support@edgarsclothing.com
```

### Security Considerations

1. **Payment Reference Encoding:**
   - Always encode/decode references
   - Validate reference format on callback

2. **Webhook Verification:**
   - Verify webhook signatures from PayNow
   - Use HMAC-SHA256 for verification
   - Rate limit webhook endpoints

3. **Data Encryption:**
   - Encrypt sensitive data in transit (HTTPS only)
   - Store payment references, not full transaction data
   - Never log sensitive payment information

4. **Access Control:**
   - Use Row Level Security on all payment tables
   - Users can only access their own transactions
   - Admin-only endpoints for refunds/settlements

### Error Handling

```typescript
// Handle common errors gracefully
const errorMessages = {
  'INVALID_PHONE': 'Phone number format is invalid',
  'INSUFFICIENT_BALANCE': 'Insufficient balance in mobile wallet',
  'PAYMENT_TIMEOUT': 'Payment confirmation took too long',
  'DUPLICATE_TRANSACTION': 'This transaction already exists',
  'AUTHENTICATION_FAILED': 'Please log in again',
}
```

### Monitoring & Alerts

Set up alerts for:
- Payment processing failures
- Unusually high transaction values
- Rapid repeated payment attempts
- Webhook delivery failures
- Database connection errors

---

## Troubleshooting

### Common Issues

**Issue: Payment not confirming**
- Check phone number format
- Verify mobile wallet has sufficient balance
- Check PayNow service status
- Review polling timeout setting

**Issue: Instalment plan creation failing**
- Verify order exists and belongs to user
- Check amount is positive
- Verify months value is 3, 6, or 12
- Check database RLS policies

**Issue: Webhook not received**
- Verify callback URL in PayNow dashboard
- Check firewall/CORS settings
- Review webhook signature verification
- Check server logs for errors

---

## Support & Resources

- **PayNow Documentation**: https://www.paynow.co.zw/developers
- **Supabase RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Zimbabwe Payment Guide**: https://www.reserve.co.zw

For technical support, contact: support@edgarsclothing.com

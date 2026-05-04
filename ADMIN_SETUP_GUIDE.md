# Admin Setup & Management Guide for edgARs

## Overview

The edgARs admin dashboard provides comprehensive management of:
- Products (Create, Read, Update, Delete)
- Payment Logs (Real-time transaction monitoring)
- Order Management
- Dashboard Analytics

---

## Default Admin Credentials

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

```
Email: admin@edgars.com
Password: AdminEdgars2024!
```

### First-Time Setup

1. **Run the setup script** to create admin user and seed products:
   ```bash
   node scripts/setup-admin.js
   ```

2. **Login with admin credentials**:
   - Navigate to `/auth/login`
   - Enter: `admin@edgars.com`
   - Enter password: `AdminEdgars2024!`

3. **Change password immediately**:
   - Access account settings
   - Update to a strong, unique password

---

## Admin Dashboard Features

### 1. Overview Tab
Dashboard showing:
- **Total Orders**: Count of all orders
- **Total Revenue**: Sum of all order totals (ZWL)
- **Total Customers**: Count of registered users
- **Pending Payments**: Orders awaiting payment completion

Recent payment activity table with latest 10 transactions.

### 2. Products Tab
Complete product management with CRUD operations:

#### Create Product
1. Click "Add Product" button
2. Fill in required fields:
   - **Product Name**: Item name
   - **Category**: Shirts, Pants, Dresses, etc.
   - **Price**: In ZWL (Zimbabwe Dollar)
   - **Image URL**: Link to product image
   - **Description**: Product details
3. Click "Add Product"

#### Edit Product
1. Click "Edit" on any product card
2. Modify fields as needed
3. Click "Update Product"

#### Delete Product
1. Click "Delete" on product card
2. Confirm deletion (cannot be undone)

### 3. Payments Tab
Real-time payment transaction logs with:
- **Search**: By customer name, transaction ID, or order ID
- **Filter**: By payment status (Pending, Completed, Failed)
- **Refresh**: Get latest data from database

#### Payment Information Shown
- Transaction ID (12-digit unique identifier)
- Order ID (First 8 characters)
- Customer Name
- Amount (in ZWL)
- Payment Method (📱 PayNow or ⏰ PayLater)
- Payment Status
- Exact date and time of transaction

---

## Sample Products

The setup script automatically inserts 17 sample products:

1. **Premium Cotton T-Shirt** - ZWL 450
2. **Slim Fit Denim Jeans** - ZWL 1,200
3. **Winter Wool Coat** - ZWL 2,500
4. **Casual Summer Dress** - ZWL 750
5. **Athletic Performance Hoodie** - ZWL 850
6. **Leather Chelsea Boots** - ZWL 1,800
7. **Casual Linen Shirt** - ZWL 550
8. **Cargo Shorts** - ZWL 380
9. **Designer Leather Belt** - ZWL 680
10. **Classic Oxford Shoes** - ZWL 1,600
11. **Wool Beanie** - ZWL 280
12. **Silk Scarf** - ZWL 420
13. **Running Sneakers** - ZWL 1,400
14. **Formal Dress Pants** - ZWL 980
15. **Polo Shirt Classic** - ZWL 520
16. **Cardigan Sweater** - ZWL 890
17. **Designer Sunglasses** - ZWL 780

---

## Payment Methods Integration

### PayNow (Instant Payments)
- **Processing Time**: 30 seconds - 2 minutes
- **Supported Wallets**: EcoCash, OneMoney, InnBucks
- **Status**: Completed immediately upon payment
- **Fees**: As per PayNow provider

### Pay Later (Flexible Instalments)
- **Plans**: 3-month (5%), 6-month (8%), 12-month (12%)
- **First Payment**: Due 30 days from order
- **Automatic Reminders**: Monthly notifications
- **Late Fee**: 2% per month after due date

---

## Admin Access Control

### Who Can Access Admin?
Only users with `admin@edgars.com` email or `is_admin: true` metadata can access the admin dashboard.

### Unauthorized Access
- Non-admin users redirected to homepage
- Login required to access any admin feature
- Session timeout after 24 hours of inactivity (configurable)

---

## Payment Logs Management

### Understanding Payment Status
- **Pending**: Payment initiated, awaiting completion
- **Completed**: PayNow payment successful
- **Paid**: Pay Later first installment received
- **Failed**: Payment failed, customer can retry

### Monitoring Payments
1. Use the Payments tab to view all transactions
2. Search for specific customers or orders
3. Filter by status to find pending/failed payments
4. Check transaction IDs for disputes
5. View exact timestamps for audit trails

### Dispute Resolution
For payment disputes:
1. Locate transaction in Payment Logs
2. Note Transaction ID and Date/Time
3. Contact PayNow support with details
4. Update order status manually if needed

---

## Best Practices

### Product Management
- ✅ Always include accurate product descriptions
- ✅ Use consistent pricing across channels
- ✅ Update inventory regularly
- ✅ Remove out-of-stock items promptly
- ❌ Don't use fake images
- ❌ Don't add duplicate products

### Payment Monitoring
- ✅ Check Payment Logs daily
- ✅ Respond to failed payments quickly
- ✅ Monitor pending payments
- ✅ Keep transaction records for tax purposes
- ❌ Don't modify transaction records
- ❌ Don't process refunds manually in DB

### Security
- ✅ Change default password immediately
- ✅ Use a strong, unique password (12+ characters)
- ✅ Never share admin credentials
- ✅ Log out after each session
- ✅ Review access logs regularly
- ❌ Don't use simple passwords
- ❌ Don't share credentials via email

---

## Troubleshooting

### Cannot Access Admin Dashboard
1. Verify you're logged in as admin@edgars.com
2. Check email for correct spelling
3. Try logging out and logging back in
4. Clear browser cache and cookies

### Products Not Showing
1. Click "Refresh" to reload data
2. Check database connection
3. Verify products exist in database
4. Try clearing page cache (Ctrl+Shift+R)

### Payment Logs Empty
1. Click "Refresh" button
2. Verify orders exist in system
3. Check date/time filter
4. Contact support if issue persists

### Slow Dashboard Performance
1. Reduce number of records shown
2. Use filters to narrow search
3. Clear browser cache
4. Check internet connection speed

---

## API Reference

### Get Payment Logs
```bash
GET /api/admin/payments
Query: status=completed, limit=50, offset=0
```

### Get Products
```bash
GET /api/products
Query: category=Shirts, featured=true
```

### Create Order from Admin
```bash
POST /api/admin/orders
Body: {
  customer_email: "user@example.com",
  items: [...],
  total: 1000
}
```

---

## Contact & Support

For technical support:
- Email: support@edgars.com
- Dashboard Help: Click ? icon (coming soon)
- Documentation: This guide and inline help

---

## Changelog

### Version 1.0.0
- ✅ Admin authentication
- ✅ Product CRUD
- ✅ Payment logs
- ✅ Dashboard analytics
- ✅ Sample products seeding
- ✅ PayNow integration
- ✅ Pay Later tracking

---

**Last Updated**: March 2026  
**System**: edgARs v1.0.0  
**Version**: Admin Dashboard 1.0.0

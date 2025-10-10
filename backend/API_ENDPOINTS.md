# CoXist AI - API Endpoints Documentation

Base URL: `http://localhost:3001/api/v1`

All protected endpoints require the `Authorization: Bearer <token>` header.

---

## 🔐 Authentication Endpoints

### 1. Signup
**POST** `/auth/signup`

Creates a new startup and admin user with 30-day pro trial.

**Request Body:**
```json
{
  "email": "founder@startup.com",
  "password": "SecurePass123",
  "startupName": "My Amazing Startup",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx123",
      "email": "founder@startup.com",
      "startupId": "clx456",
      "roles": ["Admin"],
      "permissions": ["manage_team", "manage_billing", ...]
    }
  },
  "message": "Signup successful! Welcome to CoXist AI."
}
```

---

### 2. Login
**POST** `/auth/login`

Authenticates existing user.

**Request Body:**
```json
{
  "email": "founder@startup.com",
  "password": "SecurePass123"
}
```

**Response (200):** Same as signup

---

### 3. Get Current User
**GET** `/auth/me`

Returns current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "clx123",
      "startupId": "clx456",
      "roles": ["Admin"],
      "permissions": [...],
      "email": "founder@startup.com"
    },
    "startup": {
      "id": "clx456",
      "name": "My Amazing Startup"
    }
  }
}
```

---

### 4. Create Team Member
**POST** `/auth/team-member`

Admin creates a team member (requires `manage_team` permission).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "accountant@startup.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleName": "Accountant"
}
```

**Valid Roles:** `Accountant`, `CTO`, `Sales Lead`, `Operations Manager`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx789",
    "email": "accountant@startup.com",
    "roles": ["Accountant"],
    "isActive": true
  },
  "message": "Team member created successfully"
}
```

---

## 💰 Transactions Endpoints

### 5. Create Transaction
**POST** `/transactions`

Creates a new transaction and updates account balance.

**Permissions:** `manage_transactions`

**Request Body:**
```json
{
  "amount": 5000,
  "type": "CREDIT",
  "description": "Client payment received",
  "accountId": "clx123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx789",
    "amount": 5000,
    "type": "CREDIT",
    "description": "Client payment received",
    "date": "2025-10-10T12:00:00Z",
    "startupId": "clx456",
    "accountId": "clx123"
  },
  "message": "Transaction created successfully"
}
```

---

### 6. Get Transactions
**GET** `/transactions`

Lists all transactions for the startup.

**Permissions:** `read_cashflow_dashboard`

**Query Parameters:**
- `accountId` (optional): Filter by account
- `type` (optional): Filter by CREDIT or DEBIT
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx789",
      "amount": 5000,
      "type": "CREDIT",
      "description": "Client payment received",
      "date": "2025-10-10T12:00:00Z",
      "account": {
        "id": "clx123",
        "accountName": "Main Checking"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 7. Get Transaction by ID
**GET** `/transactions/:transactionId`

**Permissions:** `read_transactions`

---

### 8. Delete Transaction
**DELETE** `/transactions/:transactionId`

Deletes transaction and reverses balance change.

**Permissions:** `manage_transactions`

---

## 📊 Dashboard Endpoints

### 9. Get Dashboard Summary
**GET** `/dashboard/summary`

Returns key financial and operational metrics.

**Permissions:** `read_cashflow_dashboard`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "financial": {
      "totalBalance": 50000,
      "monthlyBurn": 15000,
      "monthlyRevenue": 25000,
      "netCashflow": 10000,
      "runwayMonths": 3.3,
      "income": 75000,
      "expenses": 45000
    },
    "inventory": {
      "totalProducts": 10,
      "totalInventoryValue": 25000,
      "lowStockProducts": 2
    },
    "sales": {
      "totalSales30Days": 12000,
      "unitsSold30Days": 150,
      "salesCount": 45
    },
    "accounts": 2
  }
}
```

---

### 10. Get Cashflow Chart Data
**GET** `/dashboard/cashflow-chart`

Returns monthly income/expense data for charting.

**Permissions:** `read_cashflow_dashboard`

**Query Parameters:**
- `months` (optional, default: 6): Number of months to retrieve

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-04",
      "income": 20000,
      "expenses": 15000,
      "netCashflow": 5000
    },
    {
      "date": "2025-05",
      "income": 25000,
      "expenses": 16000,
      "netCashflow": 9000
    }
  ]
}
```

---

### 11. Get Recent Activity
**GET** `/dashboard/recent-activity`

Returns recent transactions and sales combined.

**Permissions:** `read_cashflow_dashboard`

**Query Parameters:**
- `limit` (optional, default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "transaction",
      "id": "clx789",
      "description": "Client payment",
      "amount": 5000,
      "transactionType": "CREDIT",
      "date": "2025-10-10T12:00:00Z",
      "account": "Main Checking"
    },
    {
      "type": "sale",
      "id": "clx890",
      "description": "Sale of 5x Product A",
      "amount": 500,
      "transactionType": "CREDIT",
      "date": "2025-10-10T11:00:00Z",
      "product": "Product A"
    }
  ]
}
```

---

## 📦 Inventory Endpoints

### 12. Create Product
**POST** `/inventory/products`

Creates a new product.

**Permissions:** `manage_inventory`

**Request Body:**
```json
{
  "name": "Product A",
  "quantity": 100,
  "price": 99.99
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx123",
    "name": "Product A",
    "quantity": 100,
    "price": 99.99,
    "startupId": "clx456",
    "createdAt": "2025-10-10T12:00:00Z"
  },
  "message": "Product created successfully"
}
```

---

### 13. Get All Products
**GET** `/inventory/products`

**Permissions:** `read_inventory_dashboard`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123",
      "name": "Product A",
      "quantity": 95,
      "price": 99.99,
      "sales": [...]
    }
  ]
}
```

---

### 14. Get Product by ID
**GET** `/inventory/products/:productId`

**Permissions:** `read_inventory`

---

### 15. Update Product
**PUT** `/inventory/products/:productId`

**Permissions:** `manage_inventory`

**Request Body:**
```json
{
  "name": "Product A - Updated",
  "quantity": 120,
  "price": 109.99
}
```

---

### 16. Delete Product
**DELETE** `/inventory/products/:productId`

**Permissions:** `manage_inventory`

---

### 17. Simulate Sale
**POST** `/inventory/sales`

Simulates a product sale, updates inventory, creates transaction.

**Permissions:** `manage_inventory`

**Request Body:**
```json
{
  "productId": "clx123",
  "quantitySold": 5,
  "accountId": "clx456"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": "clx789",
      "quantitySold": 5,
      "totalPrice": 499.95,
      "saleDate": "2025-10-10T12:00:00Z"
    },
    "transaction": {
      "id": "clx890",
      "amount": 499.95,
      "type": "CREDIT",
      "description": "Sale of 5x Product A"
    },
    "product": {
      "id": "clx123",
      "name": "Product A",
      "quantity": 95
    }
  },
  "message": "Sale simulated successfully"
}
```

---

### 18. Get Sales
**GET** `/inventory/sales`

**Permissions:** `read_inventory_dashboard`

**Query Parameters:**
- `limit` (optional): Number of sales to return

---

## 🏦 Bank Accounts Endpoints

### 19. Create Bank Account
**POST** `/accounts`

Creates a mock bank account.

**Permissions:** `manage_billing`

**Request Body:**
```json
{
  "accountName": "Main Checking Account",
  "balance": 10000
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx123",
    "accountName": "Main Checking Account",
    "balance": 10000,
    "startupId": "clx456",
    "createdAt": "2025-10-10T12:00:00Z"
  },
  "message": "Account created successfully"
}
```

---

### 20. Get All Accounts
**GET** `/accounts`

**Permissions:** `read_cashflow_dashboard`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123",
      "accountName": "Main Checking Account",
      "balance": 15000,
      "transactions": [...]
    }
  ]
}
```

---

### 21. Get Account by ID
**GET** `/accounts/:accountId`

**Permissions:** `read_cashflow_dashboard`

---

### 22. Update Account
**PUT** `/accounts/:accountId`

**Permissions:** `manage_billing`

---

### 23. Delete Account
**DELETE** `/accounts/:accountId`

**Permissions:** `manage_billing`

Note: Cannot delete accounts with existing transactions.

---

## 👥 Team Management Endpoints

### 24. Invite Team Member
**POST** `/team/invite`

Invites a new team member and sends email with credentials.

**Permissions:** `manage_team`

**Request Body:**
```json
{
  "email": "developer@startup.com",
  "roleName": "CTO",
  "firstName": "Bob",
  "lastName": "Developer"
}
```

**Valid Roles:** `Accountant`, `CTO`, `Sales Lead`, `Operations Manager`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx789",
    "email": "developer@startup.com",
    "firstName": "Bob",
    "lastName": "Developer",
    "roles": ["CTO"],
    "isActive": true,
    "tempPassword": "abc123xyz789"
  },
  "message": "Team member invited successfully. Check email for login credentials."
}
```

---

### 25. Get Team Members
**GET** `/team`

Lists all team members in the startup.

**Permissions:** `read_team`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123",
      "email": "founder@startup.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["Admin"],
      "isActive": true,
      "createdAt": "2025-09-10T12:00:00Z"
    },
    {
      "id": "clx789",
      "email": "developer@startup.com",
      "firstName": "Bob",
      "lastName": "Developer",
      "roles": ["CTO"],
      "isActive": true,
      "createdAt": "2025-10-10T12:00:00Z"
    }
  ]
}
```

---

### 26. Update User Role
**PUT** `/team/:userId/role`

Changes a user's role.

**Permissions:** `manage_team`

**Request Body:**
```json
{
  "roleName": "Operations Manager"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx789",
    "email": "developer@startup.com",
    "roles": ["Operations Manager"],
    "isActive": true
  },
  "message": "User role updated successfully"
}
```

---

### 27. Deactivate User
**POST** `/team/:userId/deactivate`

Deactivates a user account.

**Permissions:** `manage_team`

**Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## 📋 Permission Matrix

| Role | Permissions |
|------|------------|
| **Admin** | All permissions (18) |
| **Accountant** | Financial data, transactions, investor updates (13) |
| **CTO** | Dashboards, scenarios, read-only (10) |
| **Sales Lead** | Revenue, inventory dashboards (7) |
| **Operations Manager** | Inventory management, dashboards (8) |

---

## 🔒 Authentication

All protected endpoints require the following header:

```
Authorization: Bearer <JWT_TOKEN>
```

The JWT token is returned from the `/auth/signup` or `/auth/login` endpoints.

---

## ❌ Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

---

## 🚀 Quick Start

1. **Sign up a new startup:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@startup.com",
    "password": "SecurePass123",
    "startupName": "My Startup"
  }'
```

2. **Create a mock bank account:**
```bash
curl -X POST http://localhost:3001/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "accountName": "Main Checking",
    "balance": 50000
  }'
```

3. **Create a transaction:**
```bash
curl -X POST http://localhost:3001/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 5000,
    "type": "CREDIT",
    "description": "Client payment",
    "accountId": "ACCOUNT_ID"
  }'
```

4. **Get dashboard summary:**
```bash
curl http://localhost:3001/api/v1/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Version:** 1.0.0  
**Last Updated:** October 10, 2025


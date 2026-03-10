# Multi-Tenant Admin Authentication System

## Overview

This system implements a comprehensive multi-tenant admin authentication system where:

1. **Super Admin** - Can login from the main domain (`localhost:3000/login`) and manage all tenants and their admins
2. **Tenant Admins** - Can login from their subdomain (`tenant.localhost:3000/login`) and manage only their tenant's admins

## Authentication Flow

### Super Admin Flow
- **Login URL**: `http://localhost:3000/login` (main domain)
- **Access**: Can see and manage all admin users across all tenants
- **Special Tenant ID**: `super-admin`

### Tenant Admin Flow  
- **Login URL**: `http://tenant.localhost:3000/login` (subdomain)
- **Access**: Can only see and manage admin users within their own tenant
- **Tenant ID**: Matches their tenant's actual ID

## Setup Instructions

### 1. Create Super Admin User

**Option A: Using Web Interface (Recommended)**
1. Navigate to: `http://localhost:3000/setup`
2. Fill in super admin details (or use defaults)
3. Click "Create Super Admin"
4. This will automatically create:
   - 1 Super Admin user (type: 'super-admin')
   - 2 Sample tenants with tenant admins (type: 'admin')

**Option B: Using SQL Script**
```bash
# Execute the SQL script manually in your database
mysql -u your_user -p your_database < scripts/manual-super-admin.sql
```

**Option C: Using Node.js Script**
```bash
# Requires database connection
node scripts/create-super-admin.js
```

**Environment Variables** (optional):
```bash
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
```

Default credentials if not specified:
- **Email**: admin@yourdomain.com  
- **Password**: SuperAdmin123!

### 2. Database Schema

The system uses the `admin_users` table with the following key fields:

```sql
- id: varchar(255) PRIMARY KEY
- tenantId: varchar(255) NOT NULL  -- tenant ID for tenant admins, 'super-admin' for super admins
- email: varchar(255) NOT NULL
- password: varchar(255) NOT NULL
- name: varchar(255)
- type: varchar(50) NOT NULL DEFAULT 'admin'  -- 'super-admin' or 'admin'
- roleId: varchar(255) NOT NULL
- role: varchar(255) NOT NULL
```

**Migration Required**: Run the migration to add the `type` column:
```sql
-- Run: migrations/add-admin-type-column.sql
ALTER TABLE admin_users 
ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'admin';
```

### 3. Testing Locally

For local development with subdomains:

1. **Edit your hosts file** (`/etc/hosts` on Mac/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows):
```
127.0.0.1 localhost
127.0.0.1 tenant1.localhost
127.0.0.1 tenant2.localhost
```

2. **Start your development server x**:
```bash
npm run dev
```

3. **Test URLs**:
- Super Admin: `http://localhost:3000/login`
- Demo Tenant 1: `http://demo1.localhost:3000/login`
- Demo Tenant 2: `http://demo2.localhost:3000/login`

**Default Test Credentials:**
```
Super Admin:
- Email: admin@yourdomain.com
- Password: SuperAdmin123!

Demo Tenant 1:
- Email: admin@demo1.com  
- Password: Demo123!

Demo Tenant 2:
- Email: admin@demo2.com
- Password: Demo123!
```

## Key Features

### 1. Contextual Admin Management

#### Super Admin View (`/admins`)
- Shows ALL admin users across all tenants
- Displays admin type (Super Admin vs Admin)
- Displays tenant information in a separate column
- Can create admins for any tenant with any type
- Color-coded badges for different admin types

#### Super Admin Tenant Management (`/tenants`)
- View all tenants in the system
- Monitor tenant status (active, suspended, trial)
- Quick access to tenant subdomains
- Suspend/activate tenants
- View tenant statistics and summaries

#### Tenant Admin View (`/admins`) 
- Shows ONLY admin users for their specific tenant
- Displays admin type (all will be 'Admin' type)
- Can only create regular admins for their own tenant
- Cannot create super admin users
- Displays current tenant context

### 2. Role-Based Access Control

- **Super Admins**: Full system access, can manage all tenants
- **Tenant Admins**: Limited to their tenant's data and users

### 3. Secure Authentication

- Passwords are hashed using bcrypt
- JWT tokens include tenant context
- Middleware enforces tenant isolation
- Session management with proper cookie settings

## File Structure

```
lib/
├── auth.ts              # NextAuth configuration with multi-tenant support
├── schema.ts            # Database schema with tenant relationships
└── subdomain-utils.ts   # Utility functions for subdomain detection

middleware.ts            # Route protection and tenant validation

app/
├── api/admins/          # Admin CRUD APIs with tenant filtering
├── admins/              # Admin management pages
└── login/               # Universal login page

scripts/
└── create-super-admin.js # Setup script for initial super admin
```

## Security Considerations

1. **Tenant Isolation**: Admins can only access data from their own tenant
2. **Token Validation**: JWT tokens are validated against tenant context
3. **Subdomain Validation**: Middleware ensures proper tenant routing
4. **Password Security**: Bcrypt hashing with salt rounds
5. **Session Security**: Secure cookies with proper domain settings

## Production Deployment

### Environment Variables

```bash
# Database
DB_HOST=your-database-host
DB_USER=your-database-user  
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_PORT=3306

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://yourdomain.com

# Super Admin (optional)
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
```

### Subdomain Configuration

Configure your DNS and load balancer to route subdomains to your application:

```
*.yourdomain.com -> your-app-server
yourdomain.com -> your-app-server
```

## Usage Examples

### Creating a New Tenant Admin

1. **As Super Admin**:
   - Login at main domain
   - Go to `/admins`
   - Click "Add New Admin" 
   - Specify tenant ID in the form

2. **As Tenant Admin**:
   - Login at your subdomain
   - Go to `/admins`
   - Click "Add New Admin"
   - Tenant ID is automatically set

### Switching Contexts

- **Super Admin**: Access main domain to see all tenants
- **Tenant Admin**: Access your specific subdomain for tenant-scoped view

## Troubleshooting

### Common Issues

1. **"Tenant not found" error**
   - Ensure tenant exists in database
   - Check subdomain spelling
   - Verify DNS/hosts file configuration

2. **Authentication loops**
   - Clear browser cookies
   - Check NEXTAUTH_SECRET environment variable
   - Verify database connection

3. **Permission denied**
   - Confirm user's tenantId matches expected tenant
   - Check middleware logs for token validation

### Debug Logging

The system includes comprehensive logging. Check console output for:
- Tenant lookup results
- Authentication attempts  
- Token validation
- Middleware routing decisions

## API Endpoints

### Admin Management

- `GET /api/admins` - List admins (filtered by user context)
- `POST /api/admins` - Create new admin
- `PUT /api/admins/[id]` - Update admin
- `DELETE /api/admins/[id]` - Delete admin

### Tenant Management

- `GET /api/tenants/lookup` - Get tenant by subdomain
- `POST /api/tenants/register` - Register new tenant

All endpoints respect tenant context and enforce proper access controls.
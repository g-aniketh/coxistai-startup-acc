# CoXist AI Startup Accelerator API

A TypeScript Express.js API server with PostgreSQL database integration using Prisma ORM.

## 🗄️ Database Setup

This API uses PostgreSQL with Prisma ORM for database management. The database is hosted on NeonDB.

### Prisma Schema

The database includes two main models for multi-tenancy:

- **Tenant**: Represents organizations/companies
- **User**: Represents individual users belonging to tenants

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  users     User[]
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  role          String   @default("member") // 'admin', 'member'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (NeonDB configured)

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the `apps/api` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Reset database and seed with sample data
pnpm db:reset

# Seed database with sample data
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📡 API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /api/health/db` - Database connection health check

### Tenants

- `GET /api/tenants` - Get all tenants with their users
- `POST /api/tenants` - Create a new tenant
  ```json
  {
    "name": "Tenant Name"
  }
  ```

### Users

- `GET /api/users` - Get all users with their tenant information

## 🛠️ Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:reset` - Reset database and seed
- `pnpm db:studio` - Open Prisma Studio

## 🏗️ Project Structure

```
apps/api/
├── src/
│   ├── lib/
│   │   └── prisma.ts      # Prisma client instance
│   └── index.ts           # Main server file
├── prisma/
│   ├── migrations/        # Database migrations
│   ├── schema.prisma      # Prisma schema
│   └── seed.ts           # Database seed script
├── package.json
├── tsconfig.json
└── .eslintrc.js
```

## 🔧 Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (NeonDB)
- **ORM**: Prisma
- **Package Manager**: pnpm
- **Development**: tsx for hot reload

## 🔐 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request body validation
- **Error Handling**: Centralized error handling

## 📝 Next Steps

1. Add authentication middleware (JWT)
2. Implement password hashing (bcrypt)
3. Add input validation schemas (Zod)
4. Implement rate limiting
5. Add API documentation (Swagger)
6. Add unit and integration tests

# CoXist AI Startup Accelerator

A modern monorepo for the CoXist AI Startup Accelerator project, built with Next.js and Express.js.

## 🏗️ Project Structure

```
coxistai-startup-accelerator/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Express.js backend API server
├── packages/         # Shared packages (future)
├── package.json      # Root package.json with workspace scripts
└── pnpm-workspace.yaml
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)

### Installation

```bash
# Install all dependencies
pnpm install
```

### Development

```bash
# Start all applications in development mode
pnpm dev

# Or start individual applications
pnpm --filter web dev    # Start Next.js app on http://localhost:3000
pnpm --filter api dev    # Start API server on http://localhost:3001
```

### Building

```bash
# Build all applications
pnpm build

# Build individual applications
pnpm --filter web build
pnpm --filter api build
```

## 📱 Applications

### Web App (`apps/web`)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Port**: 3000

### API Server (`apps/api`)
- **Framework**: Express.js
- **Language**: TypeScript
- **Port**: 3001
- **Features**: CORS, Helmet security, JSON parsing

## 🛠️ Available Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all TypeScript packages

## 🔧 Technology Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, CORS, Helmet
- **Package Manager**: pnpm
- **Linting**: ESLint with TypeScript support

## 📝 Environment Variables

### API Server
Copy `apps/api/env.example` to `apps/api/.env` and configure:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Deployment

Each application can be deployed independently:

- **Web App**: Deploy to Vercel, Netlify, or any static hosting
- **API Server**: Deploy to Railway, Heroku, AWS, or any Node.js hosting

## 📚 Next Steps

1. Set up database integration
2. Add authentication system
3. Implement API endpoints
4. Add shared packages for common utilities
5. Set up CI/CD pipeline
6. Add testing framework

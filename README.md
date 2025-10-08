# CoXist AI - AI Finance & Cashflow Copilot for Startups 💰🚀

**Your AI CFO that ensures you never run out of money.**

An AI-powered financial management platform designed specifically for startups. CoXist AI connects to your bank accounts, automatically tracks your runway, generates forecasts, and sends proactive alerts to help you avoid running out of cash.

## 🎯 The Problem

- **80% of startups die from running out of cash**, not tech failure
- Founders rely on messy spreadsheets or expensive CFOs ($150k+/year)
- Burn rate, runway, and revenue forecasting are hard to track in real time

## ✨ The Solution

CoXist AI is your **AI CFO** that:
- 🏦 Connects to bank accounts, Stripe, and payment processors via Plaid
- 📊 Auto-generates cashflow dashboards: runway, burn rate, ARR/MRR
- 🤖 Simulates "what-if" scenarios (e.g., what happens if we cut $15k/mo in costs?)
- 📝 Auto-drafts investor updates with key metrics
- 🚨 Sends proactive alerts: *"Runway down to 4.5 months. Recommend cutting $15k/mo in SaaS spend"*

## 🎬 Key Features

### 💼 CFO Dashboard
- Real-time runway tracking (days/months remaining)
- Daily burn rate calculation
- Net cash flow analysis
- Connected account balances
- Spending breakdown by category
- Interactive cash flow charts

### 🔮 AI Financial Forecasting
- Pre-built scenarios (High Growth, Conservative, Expansion, Post-Fundraise)
- Custom scenario builder
- 12-month projections with visualization
- Runway predictions based on scenarios
- AI-powered insights and warnings

### ❤️ Financial Health Score
- 0-100 health score with breakdown
- Multi-factor analysis (Balance, Cash Flow, Burn Rate, Consistency)
- Actionable recommendations
- Health level categorization (Excellent, Good, Fair, Poor)

### 📈 Revenue Metrics (SaaS)
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Growth rate tracking
- ARPA, CAC, LTV calculations
- LTV:CAC ratio analysis
- Quick Ratio and CAC payback

### 🚨 Intelligent Alerts
- Critical runway warnings (< 3 months)
- Negative cash flow detection
- High burn rate alerts
- Low balance notifications
- Spending anomaly detection
- Customizable alert preferences

### 📰 Investor Updates
- AI-generated monthly updates
- Comprehensive financial metrics
- Key highlights and recommendations
- Copy/download functionality
- Editable before sending

### 💳 Transaction Management
- Advanced filtering and search
- Category-based organization
- Date range selection
- Pagination and sorting
- Export capabilities

## 🏗️ Project Structure

```
coxistai-startup-accelerator/
├── apps/
│   ├── web/          # Next.js frontend with 13+ pages
│   └── api/          # Express.js backend with Plaid integration
├── packages/         # Shared packages (future)
├── IMPLEMENTATION_SUMMARY.md  # Detailed feature documentation
└── pnpm-workspace.yaml
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- PostgreSQL database
- Plaid API credentials (for bank connections)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd coxistai-startup-accelerator
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

#### API (.env in apps/api/)
```env
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/coxistai?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Plaid (get from https://dashboard.plaid.com/)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox  # or development/production
```

#### Web (.env.local in apps/web/)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

4. **Set up the database**
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed  # Seed transaction categories
```

### Development

```bash
# Start all applications in development mode (from root)
pnpm dev

# Or start individual applications
pnpm --filter web dev    # Next.js app on http://localhost:3000
pnpm --filter api dev    # API server on http://localhost:3001
```

### First Time Setup

1. Navigate to http://localhost:3000
2. Register a new account
3. Log in with your credentials
4. Connect your bank account via Plaid Link
5. Start exploring your financial dashboard!

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

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Heroicons
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Bank Integration**: React Plaid Link

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **API Integration**: Plaid SDK
- **Security**: Helmet, CORS
- **Architecture**: Multi-tenant with tenant isolation

### Infrastructure
- **Monorepo**: pnpm workspaces
- **Package Manager**: pnpm
- **Linting**: ESLint with TypeScript
- **Database Migrations**: Prisma Migrate

## 📱 Available Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Marketing homepage |
| Login | `/login` | User authentication |
| Register | `/register` | New user signup |
| Dashboard | `/dashboard` | Main overview |
| **CFO Dashboard** | `/cfo-dashboard` | **Real-time financial metrics** |
| Transactions | `/transactions` | Transaction history with filters |
| **Financial Health** | `/financial-health` | **AI health score & insights** |
| **AI Forecasting** | `/forecasting` | **What-if scenarios & projections** |
| **Investor Updates** | `/investor-updates` | **Auto-generated reports** |
| **Alerts** | `/alerts` | **Proactive financial warnings** |
| **Revenue Metrics** | `/revenue-metrics` | **ARR/MRR tracking** |
| Users | `/users` | User management |
| Organizations | `/tenants` | Organization management |
| Settings | `/settings` | Account & notification settings |

## 🚀 Deployment

Each application can be deployed independently:

- **Web App**: Deploy to Vercel, Netlify, or any static hosting
- **API Server**: Deploy to Railway, Heroku, AWS, or any Node.js hosting

## 🎨 Screenshots

### CFO Dashboard
Real-time financial overview with runway, burn rate, and cash flow tracking.

### AI Forecasting
Simulate different scenarios to plan your financial future.

### Financial Health Score
Get an instant assessment of your startup's financial wellness.

## 💰 Business Model

### Pricing Tiers
- **Startup**: $50-200/month
  - Bank account connections
  - Real-time dashboards
  - Basic forecasting
  - Transaction tracking
  
- **Growth**: $500-2,000/month (SMB)
  - Everything in Startup
  - Advanced AI forecasting
  - Automated investor updates
  - Custom alerts
  - Priority support

### Target Market
- **Primary**: 5M+ startups globally
- **Secondary**: 300M+ small businesses worldwide
- **TAM**: $50B+ spent on CFO, accounting, and FP&A tools

### Competitive Advantage
- ✅ AI-native vs. manual competitors (Mosaic, Pry, Puzzle)
- ✅ Founder-first UX vs. enterprise-focused tools
- ✅ Affordable vs. $150k+ CFO salaries
- ✅ Real-time vs. spreadsheet-based tracking

## 🛣️ Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Bank account integration via Plaid
- [x] Real-time financial dashboards
- [x] Transaction tracking and categorization
- [x] Runway and burn rate calculations
- [x] Financial health scoring
- [x] AI forecasting with scenarios
- [x] Investor update generation
- [x] Intelligent alerts system
- [x] Revenue metrics (ARR/MRR)

### 🔄 Phase 2: Enhanced Features (Next)
- [ ] Stripe integration for better revenue tracking
- [ ] Email notifications for alerts
- [ ] Export to PDF/Excel
- [ ] Team collaboration features
- [ ] Mobile app (iOS/Android)
- [ ] Advanced ML forecasting

### 🔮 Phase 3: Enterprise (Future)
- [ ] QuickBooks/Xero integration
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Payroll automation
- [ ] Vendor negotiation tools
- [ ] Tax optimization
- [ ] Multi-currency support
- [ ] White-label solutions

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 📄 License

[License information here]

## 💬 Support

- **Documentation**: See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for detailed feature docs
- **Issues**: Open an issue on GitHub
- **Email**: support@coxist.ai (if applicable)

## 🙏 Acknowledgments

- Built with ❤️ for startup founders
- Powered by Plaid for bank connectivity
- Charts by Recharts
- Icons by Heroicons

---

**Remember**: 80% of startups fail because they run out of cash. Don't be part of that statistic. Let CoXist AI be your financial co-pilot. 🚀

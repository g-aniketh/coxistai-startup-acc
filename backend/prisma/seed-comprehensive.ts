import { PrismaClient, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // NOTE: The data cleanup step has been removed as `prisma migrate reset --force`
  // already handles dropping the database, making this step redundant and error-prone.

  // 2. Create Permissions
  const permissions = [
    // User Management
    { action: 'manage', subject: 'User' },
    { action: 'create', subject: 'User' },
    { action: 'read', subject: 'User' },
    { action: 'update', subject: 'User' },
    { action: 'delete', subject: 'User' },
    // Financials
    { action: 'manage', subject: 'transactions' },
    { action: 'read', subject: 'transactions' },
    { action: 'manage', subject: 'Account' },
    { action: 'read', subject: 'Account' },
    { action: 'read', subject: 'cashflow_dashboard' },
    { action: 'manage', subject: 'billing' },
    // Inventory
    { action: 'manage', subject: 'inventory' },
    { action: 'read', subject: 'inventory' },
    { action: 'read', subject: 'inventory_dashboard' },
    // Team Management
    { action: 'manage', subject: 'team' },
    { action: 'read', subject: 'team' },
    // AI Features
    { action: 'manage', subject: 'CFO' },
    { action: 'read', subject: 'CFO' },
    { action: 'read', subject: 'Dashboard' },
    { action: 'read', subject: 'analytics' },
    { action: 'use', subject: 'what_if_scenarios' },
    { action: 'manage', subject: 'investor_updates' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) => prisma.permission.create({ data: p }))
  );
  const permissionMap = new Map(createdPermissions.map((p) => [`${p.action}-${p.subject}`, p]));
  console.log('✓ Created permissions');

  // 3. Create Roles and Assign Permissions
  const roles = {
    Admin: ['manage-User', 'manage-transactions', 'manage-Account', 'manage-inventory', 'manage-CFO', 'read-Dashboard', 'read-cashflow_dashboard', 'manage-billing', 'manage-team', 'read-analytics', 'use-what_if_scenarios', 'manage-investor_updates'],
    CFO: ['read-User', 'manage-transactions', 'manage-Account', 'read-inventory', 'manage-CFO', 'read-Dashboard', 'read-cashflow_dashboard', 'manage-billing', 'read-team', 'read-analytics', 'use-what_if_scenarios', 'manage-investor_updates'],
    Accountant: ['read-User', 'manage-transactions', 'manage-Account', 'read-inventory', 'read-CFO', 'read-Dashboard', 'read-cashflow_dashboard', 'manage-billing', 'read-team', 'read-analytics'],
    OperationsManager: ['read-User', 'read-transactions', 'read-Account', 'manage-inventory', 'read-CFO', 'read-Dashboard', 'read-cashflow_dashboard', 'read-inventory_dashboard', 'read-team'],
    SalesManager: ['read-transactions', 'read-Account', 'read-inventory', 'read-CFO', 'read-Dashboard', 'read-cashflow_dashboard', 'read-team'],
    Engineer: ['read-Dashboard', 'read-cashflow_dashboard'],
    MarketingLead: ['read-Dashboard', 'read-CFO', 'read-cashflow_dashboard', 'read-analytics'],
    ReadOnly: ['read-User', 'read-transactions', 'read-Account', 'read-inventory', 'read-CFO', 'read-Dashboard', 'read-cashflow_dashboard', 'read-team'],
  };

  const createdRoles = await Promise.all(
    Object.entries(roles).map(([name, perms]) =>
      prisma.role.create({
        data: {
          name,
          permissions: {
            connect: perms.map((pKey) => ({ id: permissionMap.get(pKey)?.id })).filter((p) => p.id),
          },
        },
      })
    )
  );
  const roleMap = new Map(createdRoles.map((r) => [r.name, r]));
  console.log('✓ Created roles and assigned permissions');

  // 4. Create 5 demo startups for comprehensive demo
  const startups = await Promise.all([
    prisma.startup.create({
      data: {
        name: 'Coxist AI',
        subscriptionPlan: 'pro_trial',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.startup.create({
      data: {
        name: 'Coxist AI Cloud',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.startup.create({
      data: {
        name: 'Coxist AI Analytics',
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.startup.create({
      data: {
        name: 'Coxist AI Innovations',
        subscriptionPlan: 'starter',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.startup.create({
      data: {
        name: 'Coxist AI Ventures',
        subscriptionPlan: 'pro_trial',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log('✓ Created 5 demo startups');

  // 5. Create users for each startup
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create users for Coxist AI (main demo account)
  const coxistAIUsers = await Promise.all([
    { email: 'admin@coxistai.com', firstName: 'Alex', lastName: 'Johnson', roleName: 'Admin', startupId: startups[0].id },
    { email: 'cfo@coxistai.com', firstName: 'Brenda', lastName: 'Chen', roleName: 'CFO', startupId: startups[0].id },
    { email: 'accountant@coxistai.com', firstName: 'Carlos', lastName: 'Mendoza', roleName: 'Accountant', startupId: startups[0].id },
    { email: 'demo@coxistai.com', firstName: 'Demo', lastName: 'User', roleName: 'Admin', startupId: startups[0].id },
  ].map(async (userData) => {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        startupId: userData.startupId,
      },
    });
    const role = roleMap.get(userData.roleName);
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
    return user;
  }));

  // Create users for other startups
  const otherStartupUsers = await Promise.all([
    { email: 'ceo@coxistai.cloud', firstName: 'Sarah', lastName: 'Wilson', roleName: 'Admin', startupId: startups[1].id },
    { email: 'ceo@coxistai.analytics', firstName: 'Michael', lastName: 'Brown', roleName: 'Admin', startupId: startups[2].id },
    { email: 'ceo@coxistai.innovations', firstName: 'Lisa', lastName: 'Garcia', roleName: 'Admin', startupId: startups[3].id },
    { email: 'ceo@coxistai.ventures', firstName: 'David', lastName: 'Lee', roleName: 'Admin', startupId: startups[4].id },
  ].map(async (userData) => {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        startupId: userData.startupId,
      },
    });
    const role = roleMap.get(userData.roleName);
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
    return user;
  }));

  console.log('✓ Created users for all startups');

  // 6. Create Mock Bank Accounts for each startup
  const startupAccounts = new Map();
  
  for (let i = 0; i < startups.length; i++) {
    const startup = startups[i];
    const accounts = await Promise.all([
      prisma.mockBankAccount.create({ 
        data: { 
          startupId: startup.id, 
          accountName: 'Main Checking Account', 
          balance: 0 // Will be calculated from transactions
        } 
      }),
      prisma.mockBankAccount.create({ 
        data: { 
          startupId: startup.id, 
          accountName: 'Business Savings', 
          balance: 0 
        } 
      }),
      prisma.mockBankAccount.create({ 
        data: { 
          startupId: startup.id, 
          accountName: 'Stripe Payouts', 
          balance: 0 
        } 
      }),
    ]);
    startupAccounts.set(startup.id, accounts);
  }
  console.log('✓ Created bank accounts for all startups');

  // 7. Create Transactions for each startup
  const currentDate = new Date();
  
  // Different financial profiles for each startup
  const startupProfiles = [
    { name: 'TechNova Solutions', initialFunding: 500000, monthlyRevenue: 45000, monthlyExpenses: 35000 },
    { name: 'CloudScale Inc', initialFunding: 200000, monthlyRevenue: 25000, monthlyExpenses: 20000 },
    { name: 'DataFlow Analytics', initialFunding: 1000000, monthlyRevenue: 80000, monthlyExpenses: 60000 },
    { name: 'AI Innovations Lab', initialFunding: 50000, monthlyRevenue: 12000, monthlyExpenses: 15000 },
    { name: 'GreenTech Ventures', initialFunding: 300000, monthlyRevenue: 30000, monthlyExpenses: 25000 },
  ];

  for (let startupIndex = 0; startupIndex < startups.length; startupIndex++) {
    const startup = startups[startupIndex];
    const profile = startupProfiles[startupIndex];
    const accounts = startupAccounts.get(startup.id);
    
    const transactions: {
      accountId: string;
      type: TransactionType;
      amount: number;
      description: string;
      date: Date;
    }[] = [];

    // Initial funding
    transactions.push({
      accountId: accounts[0].id,
      type: 'CREDIT',
      amount: profile.initialFunding,
      description: 'Initial seed funding',
      date: new Date(new Date().setDate(currentDate.getDate() - 90))
    });

    // Generate 90 days of transactions
    for (let i = 0; i < 90; i++) {
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - i);
      
      // Monthly expenses (payroll, rent, etc.)
      if (i % 30 === 0) {
        transactions.push({
          accountId: accounts[0].id,
          type: 'DEBIT',
          amount: profile.monthlyExpenses * 0.6, // 60% of expenses
          description: 'Monthly payroll',
          date: transactionDate
        });
      }
      
      // Weekly expenses
      if (i % 7 === 0) {
        const expenseAmount = profile.monthlyExpenses * 0.1; // 10% of monthly expenses
        transactions.push({
          accountId: accounts[0].id,
          type: 'DEBIT',
          amount: expenseAmount * (0.8 + Math.random() * 0.4),
          description: 'Operating expenses',
          date: transactionDate
        });
      }
      
      // Revenue transactions
      if (i % 3 === 0) {
        const revenueAmount = profile.monthlyRevenue / 10; // Distribute monthly revenue
        transactions.push({
          accountId: accounts[2].id, // Stripe account
          type: 'CREDIT',
          amount: revenueAmount * (0.8 + Math.random() * 0.4),
          description: 'Customer payment',
          date: transactionDate
        });
      }
    }

    // Create all transactions for this startup
    await prisma.transaction.createMany({
      data: transactions.map(t => ({ ...t, startupId: startup.id })),
    });

    // Recalculate account balances
    for (const account of accounts) {
      const credits = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { accountId: account.id, type: 'CREDIT' },
      });
      const debits = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { accountId: account.id, type: 'DEBIT' },
      });
      
      const balance = (credits._sum.amount || 0) - (debits._sum.amount || 0);
      
      await prisma.mockBankAccount.update({
        where: { id: account.id },
        data: { balance },
      });
    }
  }

  console.log('✓ Created transactions and updated balances for all startups');

  // 8. Create Products and Sales for TechNova Solutions (main demo)
  const mainStartup = startups[0];
  const mainAccounts = startupAccounts.get(mainStartup.id);
  
  const products = await Promise.all([
    prisma.product.create({ data: { startupId: mainStartup.id, name: 'Premium SaaS License', quantity: 1000, price: 299.99 } }),
    prisma.product.create({ data: { startupId: mainStartup.id, name: 'API Credits - 10K', quantity: 5000, price: 49.99 } }),
    prisma.product.create({ data: { startupId: mainStartup.id, name: 'Consulting Hours - 5hr Pack', quantity: 200, price: 750.00 } }),
  ]);

  // Create sales linked to transactions for main startup
  for(let i = 0; i < 20; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));
    const totalPrice = product.price * quantity;
    
    const transaction = await prisma.transaction.create({
      data: {
        startupId: mainStartup.id,
        accountId: mainAccounts[2].id, // Sales revenue to Stripe
        type: 'CREDIT',
        amount: totalPrice,
        description: `Sale: ${quantity} x ${product.name}`,
        date: saleDate,
      }
    });

    await prisma.sale.create({
      data: {
        startupId: mainStartup.id,
        productId: product.id,
        quantitySold: quantity,
        totalPrice: totalPrice,
        saleDate: saleDate,
        transactionId: transaction.id
      }
    });
  }

  console.log(`✓ Created ${products.length} products and simulated sales for main startup`);
  
  // 9. Create Cashflow Metrics for main startup (last 6 months)
  const cashflowMetrics: Promise<any>[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - (6 - i));
    monthStart.setDate(1);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const revenue = 45000 + (i * 5000) + Math.random() * 8000;
    const expenses = 35000 + (i * 2000) + Math.random() * 3000;
    const customers = 150 + (i * 20);

    cashflowMetrics.push(
      prisma.cashflowMetric.create({
        data: {
          startupId: mainStartup.id,
          periodStart: monthStart,
          periodEnd: monthEnd,
          totalRevenue: revenue,
          totalExpenses: expenses,
          netCashflow: revenue - expenses,
          burnRate: expenses,
          runway: (500000 / expenses), // Based on initial funding
          mrr: revenue * 0.85, // 85% recurring
          arr: revenue * 0.85 * 12,
          growthRate: i > 0 ? ((revenue / (45000 + ((i-1) * 5000))) - 1) * 100 : 0,
          cashBalance: 500000 + ((revenue - expenses) * i),
          accountsReceivable: revenue * 0.15,
          accountsPayable: expenses * 0.2,
          activeCustomers: customers,
          newCustomers: 12 + Math.floor(Math.random() * 8),
          churnedCustomers: Math.floor(Math.random() * 3),
          customerAcquisitionCost: 400 + Math.random() * 150,
          lifetimeValue: 4000 + Math.random() * 1500,
        },
      })
    );
  }
  await Promise.all(cashflowMetrics);
  console.log('✓ Created 6 months of cashflow metrics for main startup');

  // 10. Create AI Scenarios for main startup
  await Promise.all([
    prisma.aIScenario.create({
      data: {
        startupId: mainStartup.id,
        name: 'Hire 3 Engineers',
        description: 'Simulate financial impact of hiring 3 Senior Software Engineers at $150k/yr each.',
        scenarioType: 'what_if',
        inputParameters: { hireCount: 3, avgSalary: 150000, benefitsPercent: 0.25 },
        projectedExpenses: 562500, // Annual
        projectedRunway: 11.5,
        confidence: 0.95,
        insights: ['Burn rate increases by ~$47k/month.', 'Runway decreases by ~4 months.'],
        recommendations: ['Consider hiring more junior engineers to reduce cost.', 'Explore remote talent in lower-cost regions.'],
        risks: ['Hiring process may take longer than expected.', 'Increased management overhead.'],
      },
    }),
    prisma.aIScenario.create({
      data: {
        startupId: mainStartup.id,
        name: 'Revenue Growth - Best Case',
        description: '30% MoM growth with reduced churn',
        scenarioType: 'forecast',
        inputParameters: { growthRate: 0.30, churnReduction: 0.50, newCustomerTarget: 50, },
        projectedRevenue: 95000, projectedExpenses: 42000, projectedCashflow: 53000,
        projectedRunway: 18.5, confidence: 0.75,
        insights: [ 'With 30% growth, revenue could reach $95K/month in 3 months', 'Reduced churn would save ~$8K monthly', 'Customer acquisition cost trending down', ],
        recommendations: [ 'Invest $5K more in proven marketing channels', 'Launch referral program to reduce CAC', 'Hire customer success manager to reduce churn', ],
        risks: [ 'Market saturation in current segment', 'Increased competition may pressure pricing', ],
      },
    }),
  ]);
  console.log('✓ Created 2 AI scenarios for main startup');

  // 11. Create Alerts for main startup
  await Promise.all([
    prisma.alert.create({
      data: {
        startupId: mainStartup.id,
        type: 'runway',
        severity: 'warning',
        title: 'Runway is down to 8.2 months',
        message: 'Based on your current burn rate of $35,000/mo and cash balance of $287,500, your runway is approximately 8.2 months. This is above the recommended 6-month threshold but trending down.',
        currentValue: 8.2,
        thresholdValue: 6,
        recommendations: ['Consider optimizing SaaS spend to extend runway.', 'Monitor customer acquisition costs closely.', 'Prepare for Series A fundraising in Q2.'],
        isRead: false,
      },
    }),
    prisma.alert.create({
      data: {
        startupId: mainStartup.id,
        type: 'burn_rate',
        severity: 'info',
        title: 'Burn Rate Trending Up',
        message: 'Monthly burn rate increased 5% from last month to $35,000.',
        currentValue: 35000,
        thresholdValue: 33000,
        recommendations: ['Audit cloud infrastructure costs', 'Review contractor and freelancer spending', 'Optimize marketing spend efficiency'],
        isRead: false,
      },
    }),
  ]);
  console.log('✓ Created 2 alerts for main startup');

  // 12. Create Investor Updates for main startup
  await prisma.investorUpdate.create({
    data: {
      startupId: mainStartup.id,
      title: 'Q4 2024 - Strong Growth & Product Launch',
      periodStart: new Date('2024-10-01'),
      periodEnd: new Date('2024-12-31'),
      metrics: { revenue: 45000, mrr: 38250, arr: 459000, customers: 215, churnRate: 2.3, nps: 67, },
      executiveSummary: `We had an exceptional Q4, achieving 25% revenue growth and successfully launching our Enterprise tier. Our ARR now stands at $459K, putting us on track for our $600K target by Q2 2025. Key highlights include landing 3 enterprise customers, reducing churn by 35%, and expanding our team with critical hires in engineering and customer success.`,
      highlights: [ 'Revenue grew 25% QoQ to $45K MRR', 'Launched Enterprise tier with 3 early customers at $2K/mo each', 'Product NPS improved from 58 to 67', ],
      challenges: [ 'Customer acquisition cost increased 15% due to competitive landscape', 'Enterprise sales cycle longer than anticipated (avg 60 days)', ],
      nextSteps: [ 'Launch self-service onboarding to reduce CAC', 'Develop case studies from enterprise customers', 'Begin Series A fundraising conversations', ],
      revenueGrowth: 25, burnRate: 35000, runway: 8.2, isDraft: false, publishedAt: new Date(),
    },
  });
  console.log('✓ Created 1 investor update for main startup');

  console.log('\n✅ Comprehensive seed completed successfully!');
  console.log('\n🔑 Login Credentials (password for all is "password123"):');
  console.log('\n📊 Main Demo Account (Coxist AI):');
  console.log('  - Admin: admin@coxistai.com');
  console.log('  - CFO: cfo@coxistai.com');
  console.log('  - Accountant: accountant@coxistai.com');
  console.log('  - Demo User: demo@coxistai.com');
  console.log('\n🏢 Other Demo Accounts:');
  console.log('  - Coxist AI Cloud: ceo@coxistai.cloud');
  console.log('  - Coxist AI Analytics: ceo@coxistai.analytics');
  console.log('  - Coxist AI Innovations: ceo@coxistai.innovations');
  console.log('  - Coxist AI Ventures: ceo@coxistai.ventures');
  console.log('\n💡 Use demo@coxistai.com for the best demo experience with full transaction history!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


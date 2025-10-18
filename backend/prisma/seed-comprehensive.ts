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
    { action: 'manage', subject: 'Transaction' },
    { action: 'read', subject: 'Transaction' },
    { action: 'manage', subject: 'Account' },
    { action: 'read', subject: 'Account' },
    // Inventory
    { action: 'manage', subject: 'Inventory' },
    { action: 'read', subject: 'Inventory' },
    // AI Features
    { action: 'manage', subject: 'CFO' },
    { action: 'read', subject: 'CFO' },
    { action: 'read', subject: 'Dashboard' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) => prisma.permission.create({ data: p }))
  );
  const permissionMap = new Map(createdPermissions.map((p) => [`${p.action}-${p.subject}`, p]));
  console.log('✓ Created permissions');

  // 3. Create Roles and Assign Permissions
  const roles = {
    Admin: ['manage-User', 'manage-Transaction', 'manage-Account', 'manage-Inventory', 'manage-CFO', 'read-Dashboard'],
    CFO: ['read-User', 'manage-Transaction', 'manage-Account', 'read-Inventory', 'manage-CFO', 'read-Dashboard'],
    Accountant: ['read-User', 'manage-Transaction', 'manage-Account', 'read-Inventory', 'read-CFO', 'read-Dashboard'],
    OperationsManager: ['read-User', 'read-Transaction', 'read-Account', 'manage-Inventory', 'read-CFO', 'read-Dashboard'],
    SalesManager: ['read-Transaction', 'read-Account', 'read-Inventory', 'read-CFO', 'read-Dashboard'],
    Engineer: ['read-Dashboard'],
    MarketingLead: ['read-Dashboard', 'read-CFO'],
    ReadOnly: ['read-User', 'read-Transaction', 'read-Account', 'read-Inventory', 'read-CFO', 'read-Dashboard'],
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

  // 4. Create a demo startup
  const startup = await prisma.startup.create({
    data: {
      name: 'TechNova Solutions',
      subscriptionPlan: 'pro_trial',
      subscriptionStatus: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });
  console.log('✓ Created startup:', startup.name);

  // 5. Create 8 users with different roles
  const hashedPassword = await bcrypt.hash('password123', 10);
  const usersToCreate = [
    { email: 'admin@technova.com', firstName: 'Alex', lastName: 'Johnson', roleName: 'Admin' },
    { email: 'cfo@technova.com', firstName: 'Brenda', lastName: 'Chen', roleName: 'CFO' },
    { email: 'accountant@technova.com', firstName: 'Carlos', lastName: 'Mendoza', roleName: 'Accountant' },
    { email: 'ops@technova.com', firstName: 'Diana', lastName: 'Smith', roleName: 'OperationsManager' },
    { email: 'sales@technova.com', firstName: 'Ethan', lastName: 'Gupta', roleName: 'SalesManager' },
    { email: 'engineer@technova.com', firstName: 'Fiona', lastName: 'Wang', roleName: 'Engineer' },
    { email: 'marketing@technova.com', firstName: 'George', lastName: 'Miller', roleName: 'MarketingLead' },
    { email: 'viewer@technova.com', firstName: 'Hannah', lastName: 'Davis', roleName: 'ReadOnly' },
  ];

  const createdUsers = await Promise.all(
    usersToCreate.map(async (userData) => {
      const user = await prisma.user.create({
    data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
      isActive: true,
          startupId: startup.id,
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
    })
  );
  console.log('✓ Created 8 users with different roles');

  // 6. Create Mock Bank Accounts
  const accounts = await Promise.all([
    prisma.mockBankAccount.create({ data: { startupId: startup.id, accountName: 'Main Checking Account', balance: 125000 } }),
    prisma.mockBankAccount.create({ data: { startupId: startup.id, accountName: 'High-Yield Savings', balance: 500000 } }),
    prisma.mockBankAccount.create({ data: { startupId: startup.id, accountName: 'Stripe Payouts', balance: 75000 } }),
  ]);
  console.log('✓ Created 3 mock bank accounts');

  // 7. Create Transactions to simulate activity
  const transactions: {
    accountId: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: Date;
  }[] = [];
  const currentDate = new Date();

  // Initial deposits
  transactions.push({ accountId: accounts[0].id, type: 'CREDIT', amount: 125000, description: 'Initial seed funding', date: new Date(new Date().setDate(currentDate.getDate() - 90)) });
  transactions.push({ accountId: accounts[1].id, type: 'CREDIT', amount: 500000, description: 'Series A funding', date: new Date(new Date().setDate(currentDate.getDate() - 85)) });
  transactions.push({ accountId: accounts[2].id, type: 'CREDIT', amount: 75000, description: 'Initial Stripe balance', date: new Date(new Date().setDate(currentDate.getDate() - 80)) });
  
  const expenseEvents = [
    { amount: 5000, description: 'AWS Cloud Services' }, { amount: 3500, description: 'Office Rent' },
    { amount: 25000, description: 'Payroll - Team Salaries' }, { amount: 1200, description: 'Marketing - Google Ads' },
    { amount: 800, description: 'Software Subscriptions (HubSpot, Slack)' }, { amount: 2500, description: 'Contractor Payment - Design' },
  ];
  const revenueEvents = [
    { amount: 15000, description: 'Customer Payment - Acme Corp' }, { amount: 8500, description: 'Subscription Renewal - TechCo' },
    { amount: 22000, description: 'Enterprise Contract - BigClient Inc' }, { amount: 5500, description: 'API Usage Fees - StartupXYZ' },
  ];

  for (let i = 0; i < 90; i++) {
    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - i);
    // Add expenses
    if (i % 30 === 0) { // Monthly payroll
        const event = expenseEvents[2];
        transactions.push({ accountId: accounts[0].id, type: 'DEBIT', amount: event.amount * (0.95 + Math.random() * 0.1), description: event.description, date: transactionDate });
    }
    if (i % 7 === 0) { // Weekly smaller expenses
        const event = expenseEvents[Math.floor(Math.random() * expenseEvents.length)];
        if (event.description.includes('Payroll')) continue;
        transactions.push({ accountId: accounts[0].id, type: 'DEBIT', amount: event.amount * (0.9 + Math.random() * 0.2), description: event.description, date: transactionDate });
    }
    // Add revenues
    if (i % 5 === 0) { // Regular revenue
        const event = revenueEvents[Math.floor(Math.random() * revenueEvents.length)];
        transactions.push({ accountId: accounts[2].id, type: 'CREDIT', amount: event.amount * (0.9 + Math.random() * 0.2), description: event.description, date: transactionDate });
    }
  }

  await prisma.transaction.createMany({
    data: transactions.map(t => ({ ...t, startupId: startup.id })),
  });

  // Recalculate final balances
  for (const account of accounts) {
    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { accountId: account.id, type: 'CREDIT' },
    });
    const credits = result._sum.amount || 0;

    const debitsResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { accountId: account.id, type: 'DEBIT' },
    });
    const debits = debitsResult._sum.amount || 0;

    await prisma.mockBankAccount.update({
      where: { id: account.id },
      data: { balance: credits - debits },
    });
  }

  console.log(`✓ Created ${transactions.length} transactions and updated account balances`);

  // 8. Create Products and Sales
  const products = await Promise.all([
    prisma.product.create({ data: { startupId: startup.id, name: 'Premium SaaS License', quantity: 1000, price: 299.99 } }),
    prisma.product.create({ data: { startupId: startup.id, name: 'API Credits - 10K', quantity: 5000, price: 49.99 } }),
    prisma.product.create({ data: { startupId: startup.id, name: 'Consulting Hours - 5hr Pack', quantity: 200, price: 750.00 } }),
  ]);

  // Create sales linked to transactions
  const salesToCreate = [];
  const salesTransactions = [];
  for(let i = 0; i < 20; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));
    const totalPrice = product.price * quantity;
    
    const transaction = await prisma.transaction.create({
      data: {
        startupId: startup.id,
        accountId: accounts[2].id, // Sales revenue to Stripe
        type: 'CREDIT',
        amount: totalPrice,
        description: `Sale: ${quantity} x ${product.name}`,
        date: saleDate,
      }
    });

    await prisma.sale.create({
          data: {
        startupId: startup.id,
        productId: product.id,
        quantitySold: quantity,
        totalPrice: totalPrice,
        saleDate: saleDate,
        transactionId: transaction.id
      }
    });
  }

  console.log(`✓ Created ${products.length} products and simulated sales`);
  
  // 9. Create Cashflow Metrics (for the last 6 months)
  const cashflowMetrics: Promise<any>[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - (6 - i));
    monthStart.setDate(1);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const revenue = 50000 + (i * 8000) + Math.random() * 10000;
    const expenses = 35000 + (i * 2000) + Math.random() * 5000;
    const customers = 150 + (i * 25);

    cashflowMetrics.push(
      prisma.cashflowMetric.create({
        data: {
          startupId: startup.id,
          periodStart: monthStart,
          periodEnd: monthEnd,
          totalRevenue: revenue,
          totalExpenses: expenses,
          netCashflow: revenue - expenses,
          burnRate: expenses,
          runway: (250000 / expenses), // Assuming $250k in bank
          mrr: revenue * 0.85, // 85% recurring
          arr: revenue * 0.85 * 12,
          growthRate: i > 0 ? ((revenue / (50000 + ((i-1) * 8000))) - 1) * 100 : 0,
          cashBalance: 250000 + ((revenue - expenses) * i),
          accountsReceivable: revenue * 0.15,
          accountsPayable: expenses * 0.2,
          activeCustomers: customers,
          newCustomers: 15 + Math.floor(Math.random() * 10),
          churnedCustomers: Math.floor(Math.random() * 5),
          customerAcquisitionCost: 500 + Math.random() * 200,
          lifetimeValue: 5000 + Math.random() * 2000,
        },
      })
    );
  }
  await Promise.all(cashflowMetrics);
  console.log('✓ Created 6 months of cashflow metrics');

  // 10. Create AI Scenarios
  await Promise.all([
    prisma.aIScenario.create({
      data: {
        startupId: startup.id,
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
        startupId: startup.id,
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
  console.log('✓ Created 2 AI scenarios');

  // 11. Create Alerts
  await Promise.all([
    prisma.alert.create({
      data: {
        startupId: startup.id,
        type: 'runway',
        severity: 'warning',
        title: 'Runway is down to 4.5 months',
        message: 'Based on your current burn rate of $41,000/mo and cash balance of $184,500, your runway is approximately 4.5 months. This is below the recommended 6-month threshold.',
        currentValue: 4.5,
        thresholdValue: 6,
        recommendations: ['Recommend cutting $15k/mo in SaaS spend and non-essential contractors.', 'Model a hiring freeze scenario.', 'Accelerate Q4 sales pipeline outreach.'],
        isRead: false,
      },
    }),
    prisma.alert.create({
      data: {
        startupId: startup.id,
        type: 'burn_rate',
        severity: 'info',
        title: 'Burn Rate Trending Up',
        message: 'Monthly burn rate increased 8% from last month to $41,000.',
        currentValue: 41000,
        thresholdValue: 38000,
        recommendations: ['Audit cloud infrastructure costs', 'Review contractor and freelancer spending', 'Optimize marketing spend efficiency'],
        isRead: false,
      },
    }),
  ]);
  console.log('✓ Created 2 alerts');

  // 12. Create Investor Updates
  await prisma.investorUpdate.create({
      data: {
      startupId: startup.id,
        title: 'Q4 2024 - Strong Growth & Product Launch',
        periodStart: new Date('2024-10-01'),
        periodEnd: new Date('2024-12-31'),
      metrics: { revenue: 68000, mrr: 57800, arr: 693600, customers: 215, churnRate: 2.3, nps: 67, },
        executiveSummary: `We had an exceptional Q4, achieving 42% revenue growth and successfully launching our Enterprise tier. Our ARR now stands at $694K, putting us on track for our $1M target by Q2 2025. Key highlights include landing 3 enterprise customers, reducing churn by 35%, and expanding our team with critical hires in engineering and customer success.`,
      highlights: [ 'Revenue grew 42% QoQ to $68K MRR', 'Launched Enterprise tier with 3 early customers at $2K/mo each', 'Product NPS improved from 58 to 67', ],
      challenges: [ 'Customer acquisition cost increased 15% due to competitive landscape', 'Enterprise sales cycle longer than anticipated (avg 60 days)', ],
      nextSteps: [ 'Launch self-service onboarding to reduce CAC', 'Develop case studies from enterprise customers', 'Begin Series A fundraising conversations', ],
      revenueGrowth: 42, burnRate: 41000, runway: 15.8, isDraft: false, publishedAt: new Date(),
    },
  });
  console.log('✓ Created 1 investor update');

  console.log('\n✅ Comprehensive seed completed successfully!');
  console.log('\n🔑 Login Credentials (password for all is "password123"):');
  usersToCreate.forEach(u => console.log(`  - ${u.roleName}: ${u.email}`));
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


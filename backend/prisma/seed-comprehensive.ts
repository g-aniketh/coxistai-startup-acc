import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // Create a demo tenant (startup company)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'TechStartup Inc.',
      subscriptionPlan: 'pro_trial',
      subscriptionStatus: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('✓ Created tenant:', tenant.name);

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@techstartup.com',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  console.log('✓ Created admin user:', adminUser.email);

  // Create other role-based users
  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@techstartup.com',
      passwordHash: hashedPassword,
      role: UserRole.ACCOUNTANT,
      firstName: 'Sarah',
      lastName: 'Johnson',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  const cto = await prisma.user.create({
    data: {
      email: 'cto@techstartup.com',
      passwordHash: hashedPassword,
      role: UserRole.CTO,
      firstName: 'Michael',
      lastName: 'Chen',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  const opsManager = await prisma.user.create({
    data: {
      email: 'operations@techstartup.com',
      passwordHash: hashedPassword,
      role: UserRole.OPERATIONS_MANAGER,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  const salesManager = await prisma.user.create({
    data: {
      email: 'sales@techstartup.com',
      passwordHash: hashedPassword,
      role: UserRole.SALES_MANAGER,
      firstName: 'David',
      lastName: 'Kim',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  console.log('✓ Created 4 role-based team members');

  // Create Products for Inventory Management
  const products = await Promise.all([
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Premium SaaS License',
        description: 'Enterprise-grade SaaS platform license',
        sku: 'SAAS-PREM-001',
        price: 299.99,
        costPrice: 50.00,
        currentStock: 1000,
        lowStockThreshold: 100,
        category: 'Software Licenses',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'API Credits - 10K',
        description: '10,000 API call credits',
        sku: 'API-CRED-10K',
        price: 49.99,
        costPrice: 5.00,
        currentStock: 5000,
        lowStockThreshold: 500,
        category: 'API Credits',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Consulting Hours - 5hr Pack',
        description: 'Professional consulting services package',
        sku: 'CONSULT-5HR',
        price: 750.00,
        costPrice: 300.00,
        currentStock: 200,
        lowStockThreshold: 20,
        category: 'Services',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Cloud Storage - 1TB',
        description: '1 Terabyte cloud storage subscription',
        sku: 'CLOUD-1TB',
        price: 99.99,
        costPrice: 20.00,
        currentStock: 10000,
        lowStockThreshold: 1000,
        category: 'Cloud Services',
        isActive: true,
      },
    }),
  ]);

  console.log('✓ Created', products.length, 'products');

  // Create Product Transactions (sales and purchases)
  const productTransactions = [];
  const currentDate = new Date();

  for (let i = 0; i < 30; i++) {
    const daysAgo = 30 - i;
    const transactionDate = new Date(currentDate);
    transactionDate.setDate(transactionDate.getDate() - daysAgo);

    // Random sales for each product
    for (const product of products) {
      const salesQuantity = Math.floor(Math.random() * 20) + 5;
      productTransactions.push(
        prisma.productTransaction.create({
          data: {
            tenantId: tenant.id,
            productId: product.id,
            transactionType: 'sale',
            quantity: -salesQuantity,
            unitPrice: product.price,
            totalAmount: product.price.toNumber() * salesQuantity,
            notes: `Daily sales - ${transactionDate.toLocaleDateString()}`,
            createdAt: transactionDate,
          },
        })
      );

      // Update product stock
      await prisma.product.update({
        where: { id: product.id },
        data: { currentStock: { decrement: salesQuantity } },
      });
    }

    // Periodic restocking
    if (i % 7 === 0) {
      for (const product of products) {
        const restockQuantity = Math.floor(Math.random() * 500) + 200;
        productTransactions.push(
          prisma.productTransaction.create({
            data: {
              tenantId: tenant.id,
              productId: product.id,
              transactionType: 'purchase',
              quantity: restockQuantity,
              unitPrice: product.costPrice,
              totalAmount: product.costPrice.toNumber() * restockQuantity,
              notes: `Weekly restock - ${transactionDate.toLocaleDateString()}`,
              referenceNumber: `PO-${Date.now()}-${i}`,
              createdAt: transactionDate,
            },
          })
        );

        // Update product stock
        await prisma.product.update({
          where: { id: product.id },
          data: { currentStock: { increment: restockQuantity } },
        });
      }
    }
  }

  await Promise.all(productTransactions);
  console.log('✓ Created product transactions');

  // Create Simulated Bank Transactions
  const simulatedTransactions = [];
  
  // Revenue transactions (credits)
  const revenueEvents = [
    { amount: 15000, description: 'Customer Payment - Acme Corp', category: 'Revenue' },
    { amount: 8500, description: 'Subscription Renewal - TechCo', category: 'Revenue' },
    { amount: 22000, description: 'Enterprise Contract - BigClient Inc', category: 'Revenue' },
    { amount: 5500, description: 'API Usage Fees - StartupXYZ', category: 'Revenue' },
    { amount: 12000, description: 'Consulting Services - ClientA', category: 'Revenue' },
    { amount: 9500, description: 'Monthly Subscriptions - Multiple Clients', category: 'Revenue' },
  ];

  // Expense transactions (debits)
  const expenseEvents = [
    { amount: -5000, description: 'AWS Cloud Services', category: 'Infrastructure' },
    { amount: -3500, description: 'Office Rent', category: 'Rent' },
    { amount: -12000, description: 'Payroll - Team Salaries', category: 'Payroll' },
    { amount: -1200, description: 'Marketing - Google Ads', category: 'Marketing' },
    { amount: -800, description: 'Software Subscriptions', category: 'Software' },
    { amount: -2500, description: 'Contractor Payment - Development', category: 'Contractors' },
    { amount: -450, description: 'Office Supplies', category: 'Supplies' },
    { amount: -1800, description: 'Legal & Compliance', category: 'Legal' },
  ];

  for (let i = 0; i < 60; i++) {
    const daysAgo = 60 - i;
    const transactionDate = new Date(currentDate);
    transactionDate.setDate(transactionDate.getDate() - daysAgo);

    // Add 1-3 random transactions per day
    const numTransactions = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numTransactions; j++) {
      const isRevenue = Math.random() > 0.4;
      const event = isRevenue 
        ? revenueEvents[Math.floor(Math.random() * revenueEvents.length)]
        : expenseEvents[Math.floor(Math.random() * expenseEvents.length)];

      simulatedTransactions.push(
        prisma.simulatedTransaction.create({
          data: {
            tenantId: tenant.id,
            amount: event.amount * (0.8 + Math.random() * 0.4), // Add some variance
            description: event.description,
            transactionType: isRevenue ? 'credit' : 'debit',
            category: event.category,
            date: transactionDate,
            isProcessed: true,
            createdAt: transactionDate,
          },
        })
      );
    }
  }

  await Promise.all(simulatedTransactions);
  console.log('✓ Created', simulatedTransactions.length, 'simulated transactions');

  // Create Cashflow Metrics (for the last 6 months)
  const cashflowMetrics = [];
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
          tenantId: tenant.id,
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
  console.log('✓ Created', cashflowMetrics.length, 'months of cashflow metrics');

  // Create AI Scenarios
  const scenarios = await Promise.all([
    prisma.aIScenario.create({
      data: {
        tenantId: tenant.id,
        name: 'Revenue Growth - Best Case',
        description: '30% MoM growth with reduced churn',
        scenarioType: 'forecast',
        inputParameters: {
          growthRate: 0.30,
          churnReduction: 0.50,
          newCustomerTarget: 50,
        },
        projectedRevenue: 95000,
        projectedExpenses: 42000,
        projectedCashflow: 53000,
        projectedRunway: 18.5,
        confidence: 0.75,
        insights: [
          'With 30% growth, revenue could reach $95K/month in 3 months',
          'Reduced churn would save ~$8K monthly',
          'Customer acquisition cost trending down',
        ],
        recommendations: [
          'Invest $5K more in proven marketing channels',
          'Launch referral program to reduce CAC',
          'Hire customer success manager to reduce churn',
        ],
        risks: [
          'Market saturation in current segment',
          'Increased competition may pressure pricing',
        ],
      },
    }),
    prisma.aIScenario.create({
      data: {
        tenantId: tenant.id,
        name: 'Cost Optimization',
        description: 'Reduce operational costs by 25%',
        scenarioType: 'what_if',
        inputParameters: {
          costReduction: 0.25,
          targetCategories: ['Infrastructure', 'Software', 'Marketing'],
        },
        projectedRevenue: 68000,
        projectedExpenses: 31500,
        projectedCashflow: 36500,
        projectedRunway: 23.2,
        confidence: 0.88,
        insights: [
          'Switching to reserved AWS instances saves $1.2K/mo',
          'Consolidating SaaS tools saves $600/mo',
          'In-house content marketing reduces spend by $800/mo',
        ],
        recommendations: [
          'Migrate 70% of workloads to reserved instances',
          'Audit and cancel unused software subscriptions',
          'Hire content marketer instead of agency',
        ],
        risks: [
          'Service quality may temporarily dip during transitions',
          'Team productivity impact from tool changes',
        ],
      },
    }),
    prisma.aIScenario.create({
      data: {
        tenantId: tenant.id,
        name: 'Fundraising Timeline',
        description: 'Optimal timing for Series A',
        scenarioType: 'forecast',
        inputParameters: {
          targetRaise: 2000000,
          targetARR: 1000000,
          currentARR: 612000,
        },
        projectedRevenue: 85000,
        projectedExpenses: 45000,
        projectedCashflow: 40000,
        projectedRunway: 15.8,
        confidence: 0.82,
        insights: [
          'At current growth, ARR target reached in 5-6 months',
          'Start fundraising process in 3 months',
          'Current runway supports extended process',
        ],
        recommendations: [
          'Begin investor outreach in Q2',
          'Target $2M raise at $12M valuation',
          'Prepare detailed unit economics deck',
          'Get 2-3 term sheets before deciding',
        ],
        risks: [
          'Market downturn could delay fundraising',
          'Slower growth would push timeline back',
        ],
      },
    }),
  ]);

  console.log('✓ Created', scenarios.length, 'AI scenarios');

  // Create Alerts
  const alerts = await Promise.all([
    prisma.alert.create({
      data: {
        tenantId: tenant.id,
        type: 'runway',
        severity: 'warning',
        title: 'Runway Alert',
        message: 'Current runway is 15.8 months. Consider optimizing burn rate or planning fundraising.',
        currentValue: 15.8,
        thresholdValue: 18,
        recommendations: [
          'Review and reduce non-essential expenses',
          'Accelerate sales pipeline to increase revenue',
          'Consider starting fundraising conversations',
        ],
        isRead: false,
        isDismissed: false,
      },
    }),
    prisma.alert.create({
      data: {
        tenantId: tenant.id,
        type: 'burn_rate',
        severity: 'info',
        title: 'Burn Rate Trending Up',
        message: 'Monthly burn rate increased 8% from last month to $41,000.',
        currentValue: 41000,
        thresholdValue: 38000,
        recommendations: [
          'Audit cloud infrastructure costs',
          'Review contractor and freelancer spending',
          'Optimize marketing spend efficiency',
        ],
        isRead: false,
        isDismissed: false,
      },
    }),
    prisma.alert.create({
      data: {
        tenantId: tenant.id,
        type: 'cash_low',
        severity: 'critical',
        title: 'Low Stock Alert - API Credits',
        message: 'API Credits - 10K inventory below threshold. Current: 485, Threshold: 500',
        currentValue: 485,
        thresholdValue: 500,
        recommendations: [
          'Reorder API credits immediately',
          'Consider increasing automatic reorder threshold',
          'Notify sales team of potential stockout',
        ],
        isRead: false,
        isDismissed: false,
      },
    }),
    prisma.alert.create({
      data: {
        tenantId: tenant.id,
        type: 'anomaly',
        severity: 'warning',
        title: 'Unusual Expense Detected',
        message: 'Marketing expense 45% higher than 30-day average ($2,800 vs $1,930)',
        currentValue: 2800,
        thresholdValue: 1930,
        recommendations: [
          'Review recent marketing campaigns',
          'Verify all charges are legitimate',
          'Assess ROI of increased spend',
        ],
        isRead: true,
        isDismissed: false,
      },
    }),
  ]);

  console.log('✓ Created', alerts.length, 'alerts');

  // Create Investor Updates
  const investorUpdates = await Promise.all([
    prisma.investorUpdate.create({
      data: {
        tenantId: tenant.id,
        title: 'Q4 2024 - Strong Growth & Product Launch',
        periodStart: new Date('2024-10-01'),
        periodEnd: new Date('2024-12-31'),
        metrics: {
          revenue: 68000,
          mrr: 57800,
          arr: 693600,
          customers: 215,
          churnRate: 2.3,
          nps: 67,
        },
        executiveSummary: `We had an exceptional Q4, achieving 42% revenue growth and successfully launching our Enterprise tier. Our ARR now stands at $694K, putting us on track for our $1M target by Q2 2025. Key highlights include landing 3 enterprise customers, reducing churn by 35%, and expanding our team with critical hires in engineering and customer success.`,
        highlights: [
          'Revenue grew 42% QoQ to $68K MRR',
          'Launched Enterprise tier with 3 early customers at $2K/mo each',
          'Product NPS improved from 58 to 67',
          'Reduced customer churn from 3.5% to 2.3%',
          'Hired Senior Backend Engineer and Customer Success Manager',
        ],
        challenges: [
          'Customer acquisition cost increased 15% due to competitive landscape',
          'Enterprise sales cycle longer than anticipated (avg 60 days)',
          'Infrastructure costs growing faster than expected with scale',
        ],
        nextSteps: [
          'Launch self-service onboarding to reduce CAC',
          'Develop case studies from enterprise customers',
          'Optimize cloud infrastructure for 30% cost reduction',
          'Begin Series A fundraising conversations',
        ],
        revenueGrowth: 42,
        burnRate: 41000,
        runway: 15.8,
        isDraft: false,
        publishedAt: new Date(),
      },
    }),
    prisma.investorUpdate.create({
      data: {
        tenantId: tenant.id,
        title: 'Q1 2025 - Draft',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-03-31'),
        metrics: {
          revenue: 78000,
          mrr: 66300,
          arr: 795600,
          customers: 245,
          churnRate: 2.1,
          nps: 69,
        },
        executiveSummary: `Q1 2025 showed continued momentum with 15% growth and strong unit economics. We're on track to hit $1M ARR by end of Q2. Focus this quarter was on operational efficiency and product development.`,
        highlights: [
          'Revenue reached $78K MRR (+15% QoQ)',
          'Net revenue retention of 118%',
          'Achieved profitability for first time',
        ],
        challenges: [
          'Sales team capacity becoming bottleneck',
          'Need to invest in product analytics',
        ],
        nextSteps: [
          'Hire 2 additional sales reps',
          'Implement product analytics platform',
          'Expand into European market',
        ],
        revenueGrowth: 15,
        burnRate: 38500,
        runway: 18.2,
        isDraft: true,
        publishedAt: null,
      },
    }),
  ]);

  console.log('✓ Created', investorUpdates.length, 'investor updates');

  console.log('\n✅ Comprehensive seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - 1 Tenant (TechStartup Inc.)');
  console.log('  - 5 Users (1 Admin + 4 Role-based team members)');
  console.log('  - 4 Products');
  console.log('  - Product transactions for 30 days');
  console.log('  - 60 days of simulated bank transactions');
  console.log('  - 6 months of cashflow metrics');
  console.log('  - 3 AI scenarios');
  console.log('  - 4 alerts');
  console.log('  - 2 investor updates');
  console.log('\n🔑 Login Credentials:');
  console.log('  Admin: admin@techstartup.com / password123');
  console.log('  Accountant: accountant@techstartup.com / password123');
  console.log('  CTO: cto@techstartup.com / password123');
  console.log('  Operations: operations@techstartup.com / password123');
  console.log('  Sales: sales@techstartup.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


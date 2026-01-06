import {
  PrismaClient,
  TransactionType,
  VoucherCategory,
  LedgerSubtype,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_VOUCHER_TYPES } from "../src/services/voucherTypes";
import { bootstrapLedgerStructure } from "../src/services/bookkeeping";
import { createCustomer } from "../src/services/customers";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive seed...");

  // NOTE: The data cleanup step has been removed as `prisma migrate reset --force`
  // already handles dropping the database, making this step redundant and error-prone.

  // 2. Create Permissions
  const permissions = [
    // User Management
    { action: "manage", subject: "User" },
    { action: "create", subject: "User" },
    { action: "read", subject: "User" },
    { action: "update", subject: "User" },
    { action: "delete", subject: "User" },
    // Financials
    { action: "manage", subject: "transactions" },
    { action: "read", subject: "transactions" },
    { action: "manage", subject: "Account" },
    { action: "read", subject: "Account" },
    { action: "read", subject: "cashflow_dashboard" },
    { action: "manage", subject: "billing" },
    // Inventory
    { action: "manage", subject: "inventory" },
    { action: "read", subject: "inventory" },
    { action: "read", subject: "inventory_dashboard" },
    // Team Management
    { action: "manage", subject: "team" },
    { action: "read", subject: "team" },
    // AI Features
    { action: "manage", subject: "CFO" },
    { action: "read", subject: "CFO" },
    { action: "read", subject: "Dashboard" },
    { action: "read", subject: "analytics" },
    { action: "use", subject: "what_if_scenarios" },
    { action: "manage", subject: "investor_updates" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) => prisma.permission.create({ data: p }))
  );
  const permissionMap = new Map(
    createdPermissions.map((p) => [`${p.action}-${p.subject}`, p])
  );
  console.log("✓ Created permissions");

  // 3. Create Roles and Assign Permissions
  const roles = {
    Admin: [
      "manage-User",
      "manage-transactions",
      "manage-Account",
      "manage-inventory",
      "manage-CFO",
      "read-Dashboard",
      "read-cashflow_dashboard",
      "manage-billing",
      "manage-team",
      "read-analytics",
      "use-what_if_scenarios",
      "manage-investor_updates",
    ],
    CFO: [
      "read-User",
      "manage-transactions",
      "manage-Account",
      "read-inventory",
      "manage-CFO",
      "read-Dashboard",
      "read-cashflow_dashboard",
      "manage-billing",
      "read-team",
      "read-analytics",
      "use-what_if_scenarios",
      "manage-investor_updates",
    ],
    Accountant: [
      "read-User",
      "manage-transactions",
      "manage-Account",
      "read-inventory",
      "read-CFO",
      "read-Dashboard",
      "read-cashflow_dashboard",
      "manage-billing",
      "read-team",
      "read-analytics",
    ],
    OperationsManager: [
      "read-User",
      "read-transactions",
      "read-Account",
      "manage-inventory",
      "read-CFO",
      "read-Dashboard",
      "read-cashflow_dashboard",
      "read-inventory_dashboard",
      "read-team",
    ],
    SalesManager: [
      "read-transactions",
      "read-Account",
      "read-inventory",
      "read-CFO",
      "read-Dashboard",
      "read-cashflow_dashboard",
      "read-team",
    ],
    Engineer: ["read-Dashboard", "read-cashflow_dashboard"],
    MarketingLead: [
      "read-Dashboard",
      "read-CFO",
      "read-cashflow_dashboard",
      "read-analytics",
    ],
    ReadOnly: [
      "read-User",
      "read-transactions",
      "read-Account",
      "read-inventory",
      "read-CFO",
      "read-Dashboard",
      "read-cashflow_dashboard",
      "read-team",
    ],
  };

  const createdRoles = await Promise.all(
    Object.entries(roles).map(([name, perms]) =>
      prisma.role.create({
        data: {
          name,
          permissions: {
            connect: perms
              .map((pKey) => ({ id: permissionMap.get(pKey)?.id }))
              .filter((p) => p.id),
          },
        },
      })
    )
  );
  const roleMap = new Map(createdRoles.map((r) => [r.name, r]));
  console.log("✓ Created roles and assigned permissions");

  // 4. Create 2 demo startups (demo and admin accounts)
  const startups = await Promise.all([
    prisma.startup.create({
      data: {
        name: "Coxist AI",
        subscriptionPlan: "starter_earlybird",
        subscriptionStatus: "active",
        trialEndsAt: null,
      },
    }),
    prisma.startup.create({
      data: {
        name: "Coxist AI Admin",
        subscriptionPlan: "pro",
        subscriptionStatus: "active",
        trialEndsAt: null,
      },
    }),
  ]);
  console.log("✓ Created 2 demo startups");

  await Promise.all(
    startups.map((startup) => bootstrapLedgerStructure(startup.id))
  );
  console.log("✓ Bootstrapped chart of accounts and default ledgers");

  // 4b. Create company profiles for each startup
  const profileSeedData = [
    {
      displayName: "Coxist AI",
      legalName: "Coxist AI Private Limited",
      mailingName: "Coxist AI Pvt Ltd",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      postalCode: "560001",
      phone: "+91-80-4000-1234",
      email: "hello@coxistai.com",
      website: "https://www.coxistai.com",
      address: {
        label: "Headquarters",
        line1: "91 Springboard, Residency Road",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        postalCode: "560025",
        isPrimary: true,
        isBilling: true,
        isShipping: false,
      },
    },
    {
      displayName: "Coxist AI Admin",
      legalName: "Coxist AI Admin Private Limited",
      mailingName: "Coxist AI Admin",
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      postalCode: "560001",
      phone: "+91-80-4000-5678",
      email: "admin@coxistai.com",
      website: "https://www.coxistai.com",
      address: {
        label: "Headquarters",
        line1: "91 Springboard, Residency Road",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        postalCode: "560025",
        isPrimary: true,
        isBilling: true,
        isShipping: false,
      },
    },
  ];

  await Promise.all(
    startups.map((startup, index) =>
      prisma.companyProfile.create({
        data: {
          startupId: startup.id,
          displayName: profileSeedData[index].displayName,
          legalName: profileSeedData[index].legalName,
          mailingName: profileSeedData[index].mailingName,
          baseCurrency: "INR",
          country: profileSeedData[index].country,
          state: profileSeedData[index].state,
          city: profileSeedData[index].city,
          postalCode: profileSeedData[index].postalCode,
          phone: profileSeedData[index].phone,
          mobile: null,
          email: profileSeedData[index].email,
          website: profileSeedData[index].website,
          addresses: {
            create: [
              {
                ...profileSeedData[index].address,
              },
            ],
          },
        },
      })
    )
  );
  console.log("✓ Seeded company profiles for all startups");

  const now = new Date();
  const defaultFinancialYearStart = () => {
    const fiscalMonth = 3; // April (0-indexed)
    const year =
      now.getUTCMonth() >= fiscalMonth
        ? now.getUTCFullYear()
        : now.getUTCFullYear() - 1;
    return new Date(Date.UTC(year, fiscalMonth, 1));
  };

  await Promise.all(
    startups.map((startup) =>
      prisma.companyFiscalConfig.create({
        data: {
          startupId: startup.id,
          financialYearStart: defaultFinancialYearStart(),
          booksStart: new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
          ),
          allowBackdatedEntries: true,
          backdatedFrom: defaultFinancialYearStart(),
          enableEditLog: startup.subscriptionPlan === "enterprise",
        },
      })
    )
  );
  console.log("✓ Seeded fiscal configuration for all startups");

  await Promise.all(
    startups.map((startup) =>
      prisma.companySecuritySetting.create({
        data: {
          startupId: startup.id,
          tallyVaultEnabled: false,
          tallyVaultPasswordHash: null,
          tallyVaultPasswordHint: null,
          userAccessControlEnabled: !["starter", "starter_earlybird"].includes(
            startup.subscriptionPlan
          ),
          multiFactorRequired: startup.subscriptionPlan === "enterprise",
        },
      })
    )
  );
  console.log("✓ Seeded security configuration for all startups");

  await Promise.all(
    startups.map((startup) =>
      prisma.companyCurrencySetting.create({
        data: {
          startupId: startup.id,
          baseCurrencyCode: "INR",
          baseCurrencySymbol: "₹",
          baseCurrencyFormalName: "Indian Rupee",
          decimalPlaces: 2,
          decimalSeparator: ".",
          thousandSeparator: ",",
          symbolOnRight: false,
          spaceBetweenAmountAndSymbol: false,
          showAmountInMillions: false,
        },
      })
    )
  );
  console.log("✓ Seeded currency configuration for all startups");

  await Promise.all(
    startups.map((startup) =>
      prisma.companyFeatureToggle.create({
        data: {
          startupId: startup.id,
          enableAccounting: true,
          enableInventory: true,
          enableTaxation: true,
          enablePayroll: startup.subscriptionPlan === "enterprise",
          enableAIInsights: true,
          enableScenarioPlanning: true,
          enableAutomations: startup.subscriptionPlan === "enterprise",
          enableVendorManagement: !["starter", "starter_earlybird"].includes(
            startup.subscriptionPlan
          ),
          enableBillingAndInvoicing: true,
        },
      })
    )
  );
  console.log("✓ Seeded feature toggles for all startups");

  // Extended voucher types including all 13 types
  const extendedVoucherTypes = [
    ...DEFAULT_VOUCHER_TYPES,
    {
      name: "Delivery Note",
      abbreviation: "DN",
      category: "DELIVERY_NOTE" as VoucherCategory,
      prefix: "DN/",
    },
    {
      name: "Receipt Note",
      abbreviation: "RN",
      category: "RECEIPT_NOTE" as VoucherCategory,
      prefix: "RN/",
    },
    {
      name: "Stock Journal",
      abbreviation: "SJ",
      category: "STOCK_JOURNAL" as VoucherCategory,
      prefix: "SJ/",
    },
    {
      name: "Memo Voucher",
      abbreviation: "MEMO",
      category: "MEMO" as VoucherCategory,
      prefix: "MEMO/",
    },
    {
      name: "Reversing Journal",
      abbreviation: "REV",
      category: "REVERSING_JOURNAL" as VoucherCategory,
      prefix: "REV/",
    },
  ];

  for (const startup of startups) {
    for (const definition of extendedVoucherTypes) {
      const voucherType = await prisma.voucherType.create({
        data: {
          startupId: startup.id,
          name: definition.name,
          abbreviation: definition.abbreviation,
          category: definition.category,
          numberingMethod: definition.numberingMethod ?? "AUTOMATIC",
          numberingBehavior: definition.numberingBehavior ?? "RENUMBER",
          prefix: definition.prefix,
          suffix: definition.suffix,
          allowManualOverride: definition.allowManualOverride ?? false,
          allowDuplicateNumbers: definition.allowDuplicateNumbers ?? false,
          isDefault: true,
        },
      });

      await prisma.voucherNumberingSeries.create({
        data: {
          startupId: startup.id,
          voucherTypeId: voucherType.id,
          name: "Default",
          prefix: definition.prefix,
          suffix: definition.suffix,
          numberingMethod: voucherType.numberingMethod,
          numberingBehavior: voucherType.numberingBehavior,
          allowManualOverride: voucherType.allowManualOverride,
          allowDuplicateNumbers: voucherType.allowDuplicateNumbers,
          isDefault: true,
        },
      });
    }
  }
  console.log("✓ Seeded voucher types and numbering for all startups");

  // 5. Create users for each startup
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create users for both startups
  const users = await Promise.all(
    [
      {
        email: "demo@coxistai.com",
        firstName: "Demo",
        lastName: "User",
        roleName: "Admin",
        startupId: startups[0].id,
      },
      {
        email: "admin@coxistai.com",
        firstName: "Admin",
        lastName: "User",
        roleName: "Admin",
        startupId: startups[1].id,
      },
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
    })
  );

  console.log("✓ Created users for both startups");

  // 6. Create Mock Bank Accounts for each startup
  const startupAccounts = new Map();

  for (let i = 0; i < startups.length; i++) {
    const startup = startups[i];
    const accounts = await Promise.all([
      prisma.mockBankAccount.create({
        data: {
          startupId: startup.id,
          accountName: "Main Checking Account",
          balance: 0, // Will be calculated from transactions
        },
      }),
      prisma.mockBankAccount.create({
        data: {
          startupId: startup.id,
          accountName: "Business Savings",
          balance: 0,
        },
      }),
      prisma.mockBankAccount.create({
        data: {
          startupId: startup.id,
          accountName: "Stripe Payouts",
          balance: 0,
        },
      }),
    ]);
    startupAccounts.set(startup.id, accounts);
  }
  console.log("✓ Created bank accounts for all startups");

  // 7. Create Transactions for each startup
  const currentDate = new Date();

  // Different financial profiles for each startup
  const startupProfiles = [
    {
      name: "Coxist AI",
      initialFunding: 41500000,
      monthlyRevenue: 3735000,
      monthlyExpenses: 2905000,
    }, // ₹4.15Cr, ₹37.4L, ₹29.1L
    {
      name: "Coxist AI Admin",
      initialFunding: 25000000,
      monthlyRevenue: 2000000,
      monthlyExpenses: 1500000,
    }, // ₹2.5Cr, ₹20L, ₹15L
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
      type: "CREDIT",
      amount: Number(profile.initialFunding),
      description: "Initial seed funding",
      date: new Date(new Date().setDate(currentDate.getDate() - 90)),
    });

    // Generate 90 days of transactions
    for (let i = 0; i < 90; i++) {
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - i);

      // Monthly expenses (payroll, rent, etc.)
      if (i % 30 === 0) {
        transactions.push({
          accountId: accounts[0].id,
          type: "DEBIT",
          amount: Number(profile.monthlyExpenses * 0.6), // 60% of expenses
          description: "Monthly payroll",
          date: transactionDate,
        });
      }

      // Weekly expenses
      if (i % 7 === 0) {
        const expenseAmount = Number(profile.monthlyExpenses * 0.1); // 10% of monthly expenses
        transactions.push({
          accountId: accounts[0].id,
          type: "DEBIT",
          amount: Number(expenseAmount * (0.8 + Math.random() * 0.4)),
          description: "Operating expenses",
          date: transactionDate,
        });
      }

      // Revenue transactions
      if (i % 3 === 0) {
        const revenueAmount = Number(profile.monthlyRevenue / 10); // Distribute monthly revenue
        transactions.push({
          accountId: accounts[2].id, // Stripe account
          type: "CREDIT",
          amount: Number(revenueAmount * (0.8 + Math.random() * 0.4)),
          description: "Customer payment",
          date: transactionDate,
        });
      }
    }

    // Create all transactions for this startup with proper number conversion
    await prisma.transaction.createMany({
      data: transactions.map((t) => ({
        ...t,
        startupId: startup.id,
        amount: Number(t.amount),
      })),
    });

    // Update account balances atomically (same approach as production code)
    for (const transaction of transactions) {
      const balanceChange =
        transaction.type === "CREDIT"
          ? Number(transaction.amount)
          : -Number(transaction.amount);

      await prisma.mockBankAccount.update({
        where: { id: transaction.accountId },
        data: {
          balance: { increment: balanceChange },
        },
      });
    }
  }

  console.log("✓ Created transactions and updated balances for all startups");

  // 8. Create Products and Sales for main startup (demo account)
  const mainStartup = startups[0];
  const mainAccounts = startupAccounts.get(mainStartup.id);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        startupId: mainStartup.id,
        name: "Premium SaaS License",
        quantity: 1000,
        price: Number(24999),
      },
    }), // ₹24,999
    prisma.product.create({
      data: {
        startupId: mainStartup.id,
        name: "API Credits - 10K",
        quantity: 5000,
        price: Number(4199),
      },
    }), // ₹4,199
    prisma.product.create({
      data: {
        startupId: mainStartup.id,
        name: "Consulting Hours - 5hr Pack",
        quantity: 200,
        price: Number(62500),
      },
    }), // ₹62,500
  ]);

  // Create sales linked to transactions for main startup
  for (let i = 0; i < 20; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));
    const totalPrice = Number(product.price) * Number(quantity);

    const transaction = await prisma.transaction.create({
      data: {
        startupId: mainStartup.id,
        accountId: mainAccounts[2].id, // Sales revenue to Stripe
        type: "CREDIT",
        amount: Number(totalPrice),
        description: `Sale: ${quantity} x ${product.name}`,
        date: saleDate,
      },
    });

    // Update account balance atomically (sales are CREDIT/income)
    await prisma.mockBankAccount.update({
      where: { id: mainAccounts[2].id },
      data: {
        balance: { increment: Number(totalPrice) },
      },
    });

    await prisma.sale.create({
      data: {
        startupId: mainStartup.id,
        productId: product.id,
        quantitySold: Number(quantity),
        totalPrice: Number(totalPrice),
        saleDate: saleDate,
        transactionId: transaction.id,
      },
    });
  }

  console.log(
    `✓ Created ${products.length} products and simulated sales for main startup`
  );

  // 9. Create Cashflow Metrics for main startup (last 6 months)
  const cashflowMetrics: Promise<any>[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - (6 - i));
    monthStart.setDate(1);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const revenue = Number(3735000 + i * 415000 + Math.random() * 664000); // Base ₹37.4L + growth
    const expenses = Number(2905000 + i * 166000 + Math.random() * 249000); // Base ₹29.1L + growth
    const customers = 150 + i * 20;

    cashflowMetrics.push(
      prisma.cashflowMetric.create({
        data: {
          startupId: mainStartup.id,
          periodStart: monthStart,
          periodEnd: monthEnd,
          totalRevenue: Number(revenue),
          totalExpenses: Number(expenses),
          netCashflow: Number(revenue - expenses),
          burnRate: Number(expenses),
          runway: Number(41500000 / expenses), // Based on initial funding ₹4.15Cr
          mrr: Number(revenue * 0.85), // 85% recurring
          arr: Number(revenue * 0.85 * 12),
          growthRate:
            i > 0
              ? Number((revenue / (3735000 + (i - 1) * 415000) - 1) * 100)
              : 0,
          cashBalance: Number(41500000 + (revenue - expenses) * i),
          accountsReceivable: Number(revenue * 0.15),
          accountsPayable: Number(expenses * 0.2),
          activeCustomers: customers,
          newCustomers: 12 + Math.floor(Math.random() * 8),
          churnedCustomers: Math.floor(Math.random() * 3),
          customerAcquisitionCost: Number(400 + Math.random() * 150), // ₹400-550
          lifetimeValue: Number(4000 + Math.random() * 1500), // ₹4,000-5,500
        },
      })
    );
  }
  await Promise.all(cashflowMetrics);
  console.log("✓ Created 6 months of cashflow metrics for main startup");

  // 10. Create AI Scenarios for main startup
  await Promise.all([
    prisma.aIScenario.create({
      data: {
        startupId: mainStartup.id,
        name: "Hire 3 Engineers",
        description:
          "Simulate financial impact of hiring 3 Senior Software Engineers at ₹12.5L/yr each.",
        scenarioType: "what_if",
        inputParameters: {
          hireCount: 3,
          avgSalary: 1250000,
          benefitsPercent: 0.25,
        }, // ₹12.5L/yr each
        projectedExpenses: 4687500, // Annual in INR (₹46.9L)
        projectedRunway: 11.5,
        confidence: 0.95,
        insights: [
          "Burn rate increases by approximately ₹3.9 lakh/month.",
          "Runway decreases by approximately 4 months.",
        ],
        recommendations: [
          "Consider hiring more junior engineers to reduce cost.",
          "Explore remote talent in lower-cost regions.",
        ],
        risks: [
          "Hiring process may take longer than expected.",
          "Increased management overhead.",
        ],
      },
    }),
    prisma.aIScenario.create({
      data: {
        startupId: mainStartup.id,
        name: "Revenue Growth - Best Case",
        description: "30% MoM growth with reduced churn",
        scenarioType: "forecast",
        inputParameters: {
          growthRate: 0.3,
          churnReduction: 0.5,
          newCustomerTarget: 50,
        },
        projectedRevenue: 7885000,
        projectedExpenses: 3486000,
        projectedCashflow: 4399000, // INR values
        projectedRunway: 18.5,
        confidence: 0.75,
        insights: [
          "With 30% growth, revenue could reach ₹79 lakh/month in 3 months",
          "Reduced churn would save approximately ₹6.6 lakh monthly",
          "Customer acquisition cost trending down",
        ],
        recommendations: [
          "Invest ₹4.2 lakh more in proven marketing channels",
          "Launch referral program to reduce CAC",
          "Hire customer success manager to reduce churn",
        ],
        risks: [
          "Market saturation in current segment",
          "Increased competition may pressure pricing",
        ],
      },
    }),
  ]);
  console.log("✓ Created 2 AI scenarios for main startup");

  // 11. Create Alerts for main startup
  await Promise.all([
    prisma.alert.create({
      data: {
        startupId: mainStartup.id,
        type: "runway",
        severity: "warning",
        title: "Runway is down to 8.2 months",
        message:
          "Based on your current burn rate of ₹29 lakh/month and cash balance of ₹2.4 crore, your runway is approximately 8.2 months. This is above the recommended 6-month threshold but trending down.",
        currentValue: 8.2,
        thresholdValue: 6,
        recommendations: [
          "Consider optimizing SaaS spend to extend runway.",
          "Monitor customer acquisition costs closely.",
          "Prepare for Series A fundraising in Q2.",
        ],
        isRead: false,
      },
    }),
    prisma.alert.create({
      data: {
        startupId: mainStartup.id,
        type: "burn_rate",
        severity: "info",
        title: "Burn Rate Trending Up",
        message: "Monthly burn rate increased 5% from last month to ₹29 lakh.",
        currentValue: 2905000,
        thresholdValue: 2490000,
        recommendations: [
          "Audit cloud infrastructure costs",
          "Review contractor and freelancer spending",
          "Optimize marketing spend efficiency",
        ],
        isRead: false,
      },
    }),
  ]);
  console.log("✓ Created 2 alerts for main startup");

  // 12. Create Investor Updates for main startup
  await prisma.investorUpdate.create({
    data: {
      startupId: mainStartup.id,
      title: "Q4 2024 - Strong Growth & Product Launch",
      periodStart: new Date("2024-10-01"),
      periodEnd: new Date("2024-12-31"),
      metrics: {
        revenue: Number(3735000),
        mrr: Number(3174750),
        arr: Number(38097000),
        customers: 215,
        churnRate: 2.3,
        nps: 67,
      },
      executiveSummary: `We had an exceptional Q4, achieving 25% revenue growth and successfully launching our Enterprise tier. Our ARR now stands at ₹3.8 crore, putting us on track for our ₹5 crore target by Q2 2025. Key highlights include landing 3 enterprise customers, reducing churn by 35%, and expanding our team with critical hires in engineering and customer success.`,
      highlights: [
        "Revenue grew 25% QoQ to ₹3.7 lakh MRR",
        "Launched Enterprise tier with 3 early customers at ₹1.7 lakh/month each",
        "Product NPS improved from 58 to 67",
      ],
      challenges: [
        "Customer acquisition cost increased 15% due to competitive landscape",
        "Enterprise sales cycle longer than anticipated (avg 60 days)",
      ],
      nextSteps: [
        "Launch self-service onboarding to reduce CAC",
        "Develop case studies from enterprise customers",
        "Begin Series A fundraising conversations",
      ],
      revenueGrowth: 25,
      burnRate: Number(2905000),
      runway: 8.2,
      isDraft: false,
      publishedAt: new Date(),
    },
  });
  console.log("✓ Created 1 investor update for main startup");

  // 13. Create ItemMaster and WarehouseMaster for main startup
  // (mainStartup already declared above)

  // Create Warehouses
  const warehouses = await Promise.all([
    prisma.warehouseMaster.create({
      data: {
        startupId: mainStartup.id,
        name: "Main Warehouse",
        alias: "WH-001",
        address: "91 Springboard, Residency Road, Bengaluru",
        isActive: true,
      },
    }),
    prisma.warehouseMaster.create({
      data: {
        startupId: mainStartup.id,
        name: "Secondary Warehouse",
        alias: "WH-002",
        address: "5th Floor, BKC Tech Park, Mumbai",
        isActive: true,
      },
    }),
    prisma.warehouseMaster.create({
      data: {
        startupId: mainStartup.id,
        name: "Storage Unit",
        alias: "WH-003",
        address: "Plot 12, Cyber City, Gurugram",
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${warehouses.length} warehouses for main startup`);

  // Create Items with HSN/SAC, GST rates, and default rates
  const items = await Promise.all([
    prisma.itemMaster.create({
      data: {
        startupId: mainStartup.id,
        itemName: "Premium SaaS License",
        alias: "ITEM-001",
        hsnSac: "998314", // Software services
        unit: "License",
        defaultSalesRate: 24999,
        defaultPurchaseRate: 0, // Not purchased
        gstRatePercent: 18,
        isActive: true,
      },
    }),
    prisma.itemMaster.create({
      data: {
        startupId: mainStartup.id,
        itemName: "API Credits - 10K",
        alias: "ITEM-002",
        hsnSac: "998314",
        unit: "Pack",
        defaultSalesRate: 4199,
        defaultPurchaseRate: 0,
        gstRatePercent: 18,
        isActive: true,
      },
    }),
    prisma.itemMaster.create({
      data: {
        startupId: mainStartup.id,
        itemName: "Consulting Hours - 5hr Pack",
        alias: "ITEM-003",
        hsnSac: "998314",
        unit: "Pack",
        defaultSalesRate: 62500,
        defaultPurchaseRate: 0,
        gstRatePercent: 18,
        isActive: true,
      },
    }),
    prisma.itemMaster.create({
      data: {
        startupId: mainStartup.id,
        itemName: "Cloud Server - Monthly",
        alias: "ITEM-004",
        hsnSac: "998314",
        unit: "Month",
        defaultSalesRate: 15000,
        defaultPurchaseRate: 8000,
        gstRatePercent: 18,
        isActive: true,
      },
    }),
    prisma.itemMaster.create({
      data: {
        startupId: mainStartup.id,
        itemName: "Office Supplies",
        alias: "ITEM-005",
        hsnSac: "48201000", // Office supplies
        unit: "Pack",
        defaultSalesRate: 0,
        defaultPurchaseRate: 5000,
        gstRatePercent: 12,
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${items.length} items for main startup`);

  // 14. Create additional ledgers with proper ledgerSubtype
  const ledgerGroups = await prisma.ledgerGroup.findMany({
    where: { startupId: mainStartup.id },
  });

  // Find the correct groups (bootstrapLedgerStructure creates these)
  const cashGroup = ledgerGroups.find((g) => g.name === "Cash-in-hand");
  const bankGroup = ledgerGroups.find((g) => g.name === "Bank Accounts");
  const customerGroup = ledgerGroups.find((g) => g.name === "Sundry Debtors");
  const supplierGroup = ledgerGroups.find((g) => g.name === "Sundry Creditors");
  const salesGroup = ledgerGroups.find((g) => g.name === "Sales Accounts");
  const purchaseGroup = ledgerGroups.find(
    (g) => g.name === "Purchase Accounts"
  );
  const gstGroup = ledgerGroups.find((g) => g.name === "Duties & Taxes");

  // Update or create CASH ledger (bootstrapLedgerStructure already creates "Cash")
  if (cashGroup) {
    const existingCash = await prisma.ledger.findFirst({
      where: {
        startupId: mainStartup.id,
        name: "Cash",
      },
    });

    if (existingCash) {
      await prisma.ledger.update({
        where: { id: existingCash.id },
        data: {
          ledgerSubtype: LedgerSubtype.CASH,
          openingBalance: 50000,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    } else {
      await prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: cashGroup.id,
          name: "Cash",
          ledgerSubtype: LedgerSubtype.CASH,
          openingBalance: 50000,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    }
  }

  // Update or create BANK ledger (bootstrapLedgerStructure creates "Primary Bank", we want "HDFC Bank - Current Account")
  if (bankGroup) {
    // Update existing "Primary Bank" to have proper subtype, or create new "HDFC Bank - Current Account"
    const existingBank = await prisma.ledger.findFirst({
      where: {
        startupId: mainStartup.id,
        groupId: bankGroup.id,
        name: "Primary Bank",
      },
    });

    if (existingBank) {
      // Update existing "Primary Bank" ledger
      await prisma.ledger.update({
        where: { id: existingBank.id },
        data: {
          name: "HDFC Bank - Current Account",
          ledgerSubtype: LedgerSubtype.BANK,
          openingBalance: 1000000,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    } else {
      // Create new bank ledger if "Primary Bank" doesn't exist
      await prisma.ledger.upsert({
        where: {
          startupId_name: {
            startupId: mainStartup.id,
            name: "HDFC Bank - Current Account",
          },
        },
        update: {
          ledgerSubtype: LedgerSubtype.BANK,
          openingBalance: 1000000,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
        create: {
          startupId: mainStartup.id,
          groupId: bankGroup.id,
          name: "HDFC Bank - Current Account",
          ledgerSubtype: LedgerSubtype.BANK,
          openingBalance: 1000000,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    }
  }

  // Create CUSTOMER ledgers
  if (customerGroup) {
    await Promise.all([
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: customerGroup.id,
          name: "ABC Corporation",
          ledgerSubtype: LedgerSubtype.CUSTOMER,
          openingBalance: 0,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: true,
          costCenterApplicable: false,
          interestComputation: "NONE",
          creditLimit: 500000,
        },
      }),
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: customerGroup.id,
          name: "XYZ Tech Solutions",
          ledgerSubtype: LedgerSubtype.CUSTOMER,
          openingBalance: 0,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: true,
          costCenterApplicable: false,
          interestComputation: "NONE",
          creditLimit: 1000000,
        },
      }),
    ]);
  }

  // Create SUPPLIER ledgers
  if (supplierGroup) {
    await Promise.all([
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: supplierGroup.id,
          name: "Cloud Services Provider",
          ledgerSubtype: LedgerSubtype.SUPPLIER,
          openingBalance: 0,
          openingBalanceType: "CREDIT",
          inventoryAffectsStock: false,
          maintainBillByBill: true,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: supplierGroup.id,
          name: "Office Supplies Vendor",
          ledgerSubtype: LedgerSubtype.SUPPLIER,
          openingBalance: 0,
          openingBalanceType: "CREDIT",
          inventoryAffectsStock: false,
          maintainBillByBill: true,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
    ]);
  }

  // Update or create SALES ledger (bootstrapLedgerStructure already creates "Sales")
  if (salesGroup) {
    const existingSales = await prisma.ledger.findFirst({
      where: {
        startupId: mainStartup.id,
        name: "Sales",
      },
    });

    if (existingSales) {
      await prisma.ledger.update({
        where: { id: existingSales.id },
        data: {
          ledgerSubtype: LedgerSubtype.SALES,
          openingBalance: 0,
          openingBalanceType: "CREDIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    } else {
      await prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: salesGroup.id,
          name: "Sales",
          ledgerSubtype: LedgerSubtype.SALES,
          openingBalance: 0,
          openingBalanceType: "CREDIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    }
  }

  // Update or create PURCHASE ledger (bootstrapLedgerStructure already creates "Purchases")
  if (purchaseGroup) {
    const existingPurchases = await prisma.ledger.findFirst({
      where: {
        startupId: mainStartup.id,
        name: "Purchases",
      },
    });

    if (existingPurchases) {
      await prisma.ledger.update({
        where: { id: existingPurchases.id },
        data: {
          ledgerSubtype: LedgerSubtype.PURCHASE,
          openingBalance: 0,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    } else {
      await prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: purchaseGroup.id,
          name: "Purchases",
          ledgerSubtype: LedgerSubtype.PURCHASE,
          openingBalance: 0,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      });
    }
  }

  // Create GST ledgers
  if (gstGroup) {
    await Promise.all([
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: gstGroup.id,
          name: "GST Output CGST",
          ledgerSubtype: LedgerSubtype.TAX_GST_OUTPUT,
          openingBalance: 0,
          openingBalanceType: "CREDIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: gstGroup.id,
          name: "GST Output SGST",
          ledgerSubtype: LedgerSubtype.TAX_GST_OUTPUT,
          openingBalance: 0,
          openingBalanceType: "CREDIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: gstGroup.id,
          name: "GST Output IGST",
          ledgerSubtype: LedgerSubtype.TAX_GST_OUTPUT,
          openingBalance: 0,
          openingBalanceType: "CREDIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: gstGroup.id,
          name: "GST Input CGST",
          ledgerSubtype: LedgerSubtype.TAX_GST_INPUT,
          openingBalance: 0,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: gstGroup.id,
          name: "GST Input SGST",
          ledgerSubtype: LedgerSubtype.TAX_GST_INPUT,
          openingBalance: 0,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
      prisma.ledger.create({
        data: {
          startupId: mainStartup.id,
          groupId: gstGroup.id,
          name: "GST Input IGST",
          ledgerSubtype: LedgerSubtype.TAX_GST_INPUT,
          openingBalance: 0,
          openingBalanceType: "DEBIT",
          inventoryAffectsStock: false,
          maintainBillByBill: false,
          costCenterApplicable: false,
          interestComputation: "NONE",
        },
      }),
    ]);
  }

  console.log(
    "✓ Created additional ledgers with proper subtypes for main startup"
  );

  // 15. Create GST Registration and Mappings
  const gstRegistration = await prisma.gstRegistration.create({
    data: {
      startupId: mainStartup.id,
      registrationType: "REGULAR",
      gstin: "29AABCU9603R1ZX", // Sample GSTIN
      legalName: "Coxist AI Private Limited",
      tradeName: "Coxist AI",
      stateName: "Karnataka",
      stateCode: "29",
      startDate: new Date(),
      isDefault: true,
      isActive: true,
    },
  });

  // Create GST Ledger Mappings
  const gstLedgers = await prisma.ledger.findMany({
    where: {
      startupId: mainStartup.id,
      ledgerSubtype: {
        in: [LedgerSubtype.TAX_GST_OUTPUT, LedgerSubtype.TAX_GST_INPUT],
      },
    },
  });

  const cgstOutput = gstLedgers.find((l) => l.name.includes("Output CGST"));
  const sgstOutput = gstLedgers.find((l) => l.name.includes("Output SGST"));
  const igstOutput = gstLedgers.find((l) => l.name.includes("Output IGST"));
  const cgstInput = gstLedgers.find((l) => l.name.includes("Input CGST"));
  const sgstInput = gstLedgers.find((l) => l.name.includes("Input SGST"));
  const igstInput = gstLedgers.find((l) => l.name.includes("Input IGST"));

  if (
    cgstOutput &&
    sgstOutput &&
    igstOutput &&
    cgstInput &&
    sgstInput &&
    igstInput
  ) {
    await Promise.all([
      prisma.gstLedgerMapping.create({
        data: {
          startupId: mainStartup.id,
          registrationId: gstRegistration.id,
          mappingType: "OUTPUT_CGST",
          ledgerName: cgstOutput.name,
        },
      }),
      prisma.gstLedgerMapping.create({
        data: {
          startupId: mainStartup.id,
          registrationId: gstRegistration.id,
          mappingType: "OUTPUT_SGST",
          ledgerName: sgstOutput.name,
        },
      }),
      prisma.gstLedgerMapping.create({
        data: {
          startupId: mainStartup.id,
          registrationId: gstRegistration.id,
          mappingType: "OUTPUT_IGST",
          ledgerName: igstOutput.name,
        },
      }),
      prisma.gstLedgerMapping.create({
        data: {
          startupId: mainStartup.id,
          registrationId: gstRegistration.id,
          mappingType: "INPUT_CGST",
          ledgerName: cgstInput.name,
        },
      }),
      prisma.gstLedgerMapping.create({
        data: {
          startupId: mainStartup.id,
          registrationId: gstRegistration.id,
          mappingType: "INPUT_SGST",
          ledgerName: sgstInput.name,
        },
      }),
      prisma.gstLedgerMapping.create({
        data: {
          startupId: mainStartup.id,
          registrationId: gstRegistration.id,
          mappingType: "INPUT_IGST",
          ledgerName: igstInput.name,
        },
      }),
    ]);
  }

  console.log(
    "✓ Created GST registration and ledger mappings for main startup"
  );

  // 16. Create 10 customers for each startup
  const customerData = [
    {
      customerName: "ABC Corporation",
      customerType: "BUSINESS" as const,
      phone: "+91-80-1234-5678",
      email: "contact@abccorp.com",
      billingAddressLine1: "123 Business Park",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pincode: "560001",
      gstApplicable: true,
      gstin: "29AABCU1234A1Z5",
      placeOfSupplyState: "29",
      creditLimitAmount: 500000,
      creditPeriodDays: 30,
    },
    {
      customerName: "XYZ Tech Solutions",
      customerType: "BUSINESS" as const,
      phone: "+91-22-2345-6789",
      email: "info@xyztech.com",
      billingAddressLine1: "456 Tech Tower",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
      gstApplicable: true,
      gstin: "27BXYZU5678B2Y6",
      placeOfSupplyState: "27",
      creditLimitAmount: 1000000,
      creditPeriodDays: 45,
    },
    {
      customerName: "Global Enterprises Ltd",
      customerType: "BUSINESS" as const,
      phone: "+91-11-3456-7890",
      email: "sales@globalent.com",
      billingAddressLine1: "789 Corporate Plaza",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110001",
      gstApplicable: true,
      gstin: "07CGLOU9012C3X7",
      placeOfSupplyState: "07",
      creditLimitAmount: 2000000,
      creditPeriodDays: 60,
    },
    {
      customerName: "Rajesh Kumar",
      customerType: "INDIVIDUAL" as const,
      phone: "+91-98765-43210",
      email: "rajesh.kumar@email.com",
      billingAddressLine1: "Flat 101, Green Heights",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      pincode: "411001",
      gstApplicable: false,
      creditLimitAmount: 100000,
      creditPeriodDays: 15,
    },
    {
      customerName: "Innovation Labs Pvt Ltd",
      customerType: "BUSINESS" as const,
      phone: "+91-40-4567-8901",
      email: "hello@innovationlabs.com",
      billingAddressLine1: "321 Innovation Hub",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500081",
      gstApplicable: true,
      gstin: "36AINNOU3456D4W8",
      placeOfSupplyState: "36",
      creditLimitAmount: 750000,
      creditPeriodDays: 30,
    },
    {
      customerName: "Priya Sharma",
      customerType: "INDIVIDUAL" as const,
      phone: "+91-87654-32109",
      email: "priya.sharma@email.com",
      billingAddressLine1: "A-202, Sunrise Apartments",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pincode: "600032",
      gstApplicable: false,
      creditLimitAmount: 50000,
      creditPeriodDays: 7,
    },
    {
      customerName: "Digital Solutions Inc",
      customerType: "BUSINESS" as const,
      phone: "+91-33-5678-9012",
      email: "contact@digitalsolutions.com",
      billingAddressLine1: "555 Digital Park",
      city: "Kolkata",
      state: "West Bengal",
      country: "India",
      pincode: "700001",
      gstApplicable: true,
      gstin: "19ADIGIU7890E5V9",
      placeOfSupplyState: "19",
      creditLimitAmount: 1500000,
      creditPeriodDays: 45,
    },
    {
      customerName: "Amit Patel",
      customerType: "INDIVIDUAL" as const,
      phone: "+91-76543-21098",
      email: "amit.patel@email.com",
      billingAddressLine1: "B-304, Skyline Towers",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      pincode: "380001",
      gstApplicable: false,
      creditLimitAmount: 75000,
      creditPeriodDays: 10,
    },
    {
      customerName: "Cloud Services Co",
      customerType: "BUSINESS" as const,
      phone: "+91-80-6789-0123",
      email: "info@cloudservices.com",
      billingAddressLine1: "888 Cloud Center",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pincode: "560025",
      gstApplicable: true,
      gstin: "29ACLOU2345F6A1",
      placeOfSupplyState: "29",
      creditLimitAmount: 3000000,
      creditPeriodDays: 60,
    },
    {
      customerName: "Sneha Reddy",
      customerType: "INDIVIDUAL" as const,
      phone: "+91-65432-10987",
      email: "sneha.reddy@email.com",
      billingAddressLine1: "C-501, Garden View",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pincode: "560095",
      gstApplicable: false,
      creditLimitAmount: 25000,
      creditPeriodDays: 5,
    },
  ];

  // Create customers for both startups
  for (const startup of startups) {
    for (const customer of customerData) {
      try {
        await createCustomer(startup.id, customer);
      } catch (error) {
        console.warn(
          `Failed to create customer ${customer.customerName} for ${startup.name}:`,
          error
        );
      }
    }
  }
  console.log("✓ Created 10 customers for each startup");

  console.log("\n✅ Comprehensive seed completed successfully!");
  console.log('\n🔑 Login Credentials (password for all is "password123"):');
  console.log("\n📊 Demo Account:");
  console.log("  - Email: demo@coxistai.com");
  console.log("  - Role: Admin");
  console.log("  - Features: Full access with comprehensive seeded data");
  console.log("\n📊 Admin Account:");
  console.log("  - Email: admin@coxistai.com");
  console.log("  - Role: Admin");
  console.log("  - Features: Full access with comprehensive seeded data");
  console.log(
    "\n💡 Use demo@coxistai.com for the best demo experience with full transaction history and 10 customers!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    // @ts-ignore - process is available in Node.js environment
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

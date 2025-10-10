import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'CoXist AI Demo',
    },
  });
  console.log('✅ Created tenant:', tenant.name);

  // Create a test user with password "password123"
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@coxistai.com',
      passwordHash: hashedPassword,
      role: 'admin',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Created user:', user.email);
  console.log('   Password: password123');

  // Seed transaction categories
  console.log('🏷️  Seeding transaction categories...');
  
  const categories = [
    { name: 'Income', subcategories: ['Income - Salary', 'Income - Freelance', 'Income - Investment', 'Income - Other'] },
    { name: 'Food and Drink', subcategories: ['Food - Restaurants', 'Food - Groceries', 'Food - Coffee Shops', 'Food - Fast Food'] },
    { name: 'Shopping', subcategories: ['Shopping - Clothing', 'Shopping - Electronics', 'Shopping - General', 'Shopping - Online'] },
    { name: 'Transportation', subcategories: ['Transport - Gas', 'Transport - Public Transit', 'Transport - Ride Share', 'Transport - Parking'] },
    { name: 'Bills and Utilities', subcategories: ['Bills - Internet', 'Bills - Phone', 'Bills - Electric', 'Bills - Water', 'Bills - Gas Utility'] },
    { name: 'Entertainment', subcategories: ['Entertainment - Movies', 'Entertainment - Music', 'Entertainment - Games', 'Entertainment - Events'] },
    { name: 'Healthcare', subcategories: ['Healthcare - Doctor', 'Healthcare - Pharmacy', 'Healthcare - Insurance', 'Healthcare - Gym'] },
    { name: 'Travel', subcategories: ['Travel - Flights', 'Travel - Hotels', 'Travel - Vacation', 'Travel - Car Rental'] },
    { name: 'Business Expenses', subcategories: ['Business - Office Supplies', 'Business - Software', 'Business - Marketing', 'Business - Professional Services'] },
  ];

  for (const category of categories) {
    const parent = await prisma.transactionCategory.create({
      data: { name: category.name },
    });
    
    for (const subName of category.subcategories) {
      await prisma.transactionCategory.create({
        data: {
          name: subName,
          parentId: parent.id,
        },
      });
    }
  }
  
  console.log('✅ Seeded transaction categories');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Email: demo@coxistai.com');
  console.log('   Password: password123');
  console.log('\n🚀 You can now login at http://localhost:3000/login');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

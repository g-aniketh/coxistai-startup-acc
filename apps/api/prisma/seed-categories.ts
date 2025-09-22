import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTransactionCategories() {
  try {
    console.log('🌱 Seeding transaction categories...');

    // Create main categories
    const mainCategories = [
      { name: 'Food and Dining' },
      { name: 'Transportation' },
      { name: 'Shopping' },
      { name: 'Entertainment' },
      { name: 'Bills and Utilities' },
      { name: 'Healthcare' },
      { name: 'Travel' },
      { name: 'Business' },
      { name: 'Education' },
      { name: 'Personal Care' },
      { name: 'Investments' },
      { name: 'Income' },
    ];

    const createdCategories = [];
    for (const category of mainCategories) {
      const created = await prisma.transactionCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
      createdCategories.push(created);
      console.log(`✅ Created category: ${created.name}`);
    }

    // Create subcategories for Food and Dining
    const foodCategory = createdCategories.find(c => c.name === 'Food and Dining');
    if (foodCategory) {
      const foodSubcategories = [
        'Restaurants',
        'Fast Food',
        'Coffee Shops',
        'Groceries',
        'Alcohol & Bars',
      ];

      for (const subcategory of foodSubcategories) {
        await prisma.transactionCategory.upsert({
          where: { name: subcategory },
          update: {},
          create: {
            name: subcategory,
            parentId: foodCategory.id,
          },
        });
        console.log(`✅ Created subcategory: ${subcategory}`);
      }
    }

    // Create subcategories for Transportation
    const transportCategory = createdCategories.find(c => c.name === 'Transportation');
    if (transportCategory) {
      const transportSubcategories = [
        'Gas & Fuel',
        'Public Transportation',
        'Rideshare & Taxi',
        'Parking',
        'Auto Insurance',
        'Auto Maintenance',
      ];

      for (const subcategory of transportSubcategories) {
        await prisma.transactionCategory.upsert({
          where: { name: subcategory },
          update: {},
          create: {
            name: subcategory,
            parentId: transportCategory.id,
          },
        });
        console.log(`✅ Created subcategory: ${subcategory}`);
      }
    }

    // Create subcategories for Business
    const businessCategory = createdCategories.find(c => c.name === 'Business');
    if (businessCategory) {
      const businessSubcategories = [
        'Office Supplies',
        'Software & Subscriptions',
        'Professional Services',
        'Marketing & Advertising',
        'Travel & Meals',
        'Equipment',
      ];

      for (const subcategory of businessSubcategories) {
        await prisma.transactionCategory.upsert({
          where: { name: subcategory },
          update: {},
          create: {
            name: subcategory,
            parentId: businessCategory.id,
          },
        });
        console.log(`✅ Created subcategory: ${subcategory}`);
      }
    }

    console.log('🎉 Transaction categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding transaction categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTransactionCategories();

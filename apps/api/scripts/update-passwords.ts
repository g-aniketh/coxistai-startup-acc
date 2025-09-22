import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/jwt';

const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    console.log('🔐 Updating user passwords...');

    // Update all users with hashed passwords
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      const hashedPassword = await hashPassword('password123');
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword }
      });
      console.log(`✅ Updated password for ${user.email}`);
    }

    console.log('🎉 All passwords updated successfully!');
    console.log('Test credentials:');
    console.log('- admin@coxist.ai / password123');
    console.log('- member@coxist.ai / password123');
    console.log('- ceo@techstart.com / password123');
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();

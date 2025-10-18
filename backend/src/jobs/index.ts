import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { AlertsService } from '../services/alerts';

const prisma = new PrismaClient();

// ============================================================================
// CRON JOB DEFINITIONS
// ============================================================================

/**
 * Daily Financial Health Check
 *
 * This job runs once every day at midnight.
 * It iterates through all active startups and generates financial alerts
 * based on their latest metrics.
 */
const dailyFinancialCheck = cron.schedule('0 0 * * *', async () => {
  console.log('Running daily financial health check...');
  
  try {
    const startups = await prisma.startup.findMany({
      where: {
        subscriptionStatus: 'active',
      },
    });

    console.log(`Found ${startups.length} active startups to process.`);

    for (const startup of startups) {
      try {
        await AlertsService.generateAlerts(startup.id);
        console.log(`Successfully generated alerts for startup: ${startup.name} (${startup.id})`);
      } catch (error) {
        console.error(`Failed to generate alerts for startup: ${startup.name} (${startup.id})`, error);
      }
    }

    console.log('✅ Daily financial health check completed.');
  } catch (error) {
    console.error('❌ Error during daily financial health check:', error);
  }
});

// ============================================================================
// JOB SCHEDULER
// ============================================================================

export const startJobs = () => {
  console.log('🚀 Starting cron jobs...');
  dailyFinancialCheck.start();
};

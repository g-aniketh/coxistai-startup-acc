import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Define Permissions
  const permissions = [
    // Team Management
    { action: 'manage', subject: 'team', description: 'Create, update, and delete team members' },
    { action: 'read', subject: 'team', description: 'View team members' },
    
    // Billing
    { action: 'manage', subject: 'billing', description: 'Manage subscription and billing' },
    { action: 'read', subject: 'billing', description: 'View billing information' },
    
    // Dashboards
    { action: 'read', subject: 'cashflow_dashboard', description: 'View cashflow dashboard' },
    { action: 'read', subject: 'burn_runway', description: 'View burn rate and runway metrics' },
    { action: 'read', subject: 'revenue_forecast', description: 'View revenue forecasting' },
    { action: 'read', subject: 'inventory_dashboard', description: 'View inventory dashboard' },
    
    // Transactions
    { action: 'manage', subject: 'transactions', description: 'Create, update, and delete transactions' },
    { action: 'read', subject: 'transactions', description: 'View transactions' },
    
    // Inventory
    { action: 'manage', subject: 'inventory', description: 'Create, update, and delete inventory items' },
    { action: 'read', subject: 'inventory', description: 'View inventory' },
    
    // AI Features
    { action: 'use', subject: 'what_if_scenarios', description: 'Create and run what-if scenarios' },
    { action: 'read', subject: 'what_if_scenarios', description: 'View what-if scenarios' },
    
    // Investor Updates
    { action: 'manage', subject: 'investor_updates', description: 'Create and edit investor updates' },
    { action: 'read', subject: 'investor_updates', description: 'View investor updates' },
    
    // Analytics
    { action: 'read', subject: 'analytics', description: 'View analytics and reports' },
    { action: 'export', subject: 'analytics', description: 'Export analytics data' },
    
    // Alerts
    { action: 'manage', subject: 'alerts', description: 'Configure alert settings' },
    { action: 'read', subject: 'alerts', description: 'View alerts and notifications' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { action_subject: { action: p.action, subject: p.subject } },
      update: {},
      create: p,
    });
  }
  console.log('✅ Permissions seeded.');

  // Define Roles and their Permissions
  const rolesPermissions = {
    'Admin': [
      'manage_team',
      'manage_billing',
      'read_cashflow_dashboard',
      'read_burn_runway',
      'read_revenue_forecast',
      'read_inventory_dashboard',
      'manage_transactions',
      'read_transactions',
      'manage_inventory',
      'read_inventory',
      'use_what_if_scenarios',
      'read_what_if_scenarios',
      'manage_investor_updates',
      'read_investor_updates',
      'read_analytics',
      'export_analytics',
      'manage_alerts',
      'read_alerts',
    ],
    'Accountant': [
      'read_cashflow_dashboard',
      'read_burn_runway',
      'read_revenue_forecast',
      'manage_transactions',
      'read_transactions',
      'use_what_if_scenarios',
      'read_what_if_scenarios',
      'manage_investor_updates',
      'read_investor_updates',
      'read_billing',
      'read_analytics',
      'export_analytics',
      'read_alerts',
    ],
    'CTO': [
      'read_cashflow_dashboard',
      'read_burn_runway',
      'read_inventory_dashboard',
      'read_transactions',
      'read_inventory',
      'use_what_if_scenarios',
      'read_what_if_scenarios',
      'read_investor_updates',
      'read_analytics',
      'read_alerts',
    ],
    'Sales Lead': [
      'read_cashflow_dashboard',
      'read_revenue_forecast',
      'read_inventory_dashboard',
      'read_transactions',
      'read_inventory',
      'read_analytics',
      'read_alerts',
    ],
    'Operations Manager': [
      'read_cashflow_dashboard',
      'read_burn_runway',
      'read_inventory_dashboard',
      'read_transactions',
      'manage_inventory',
      'read_inventory',
      'read_analytics',
      'read_alerts',
    ],
  };

  for (const [roleName, permissionKeys] of Object.entries(rolesPermissions)) {
    // Create or update the role
    const createdRole = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { 
        name: roleName,
        description: `${roleName} role with predefined permissions`,
      },
    });

    // Parse permission keys to get action and subject
    const permissionsToConnect = [];
    for (const permKey of permissionKeys) {
      // Split by first underscore to get action and subject
      const parts = permKey.split('_');
      const action = parts[0];
      const subject = parts.slice(1).join('_');
      
      const permission = await prisma.permission.findUnique({
        where: { action_subject: { action, subject } },
      });
      
      if (permission) {
        permissionsToConnect.push({ id: permission.id });
      }
    }

    // Connect permissions to role
    await prisma.role.update({
      where: { id: createdRole.id },
      data: {
        permissions: {
          set: permissionsToConnect,
        },
      },
    });
    
    console.log(`✅ Role '${roleName}' seeded with ${permissionsToConnect.length} permissions.`);
  }
  
  console.log('✅ Roles and permissions associations seeded.');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


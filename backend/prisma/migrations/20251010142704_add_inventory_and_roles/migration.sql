/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'ACCOUNTANT', 'CTO', 'OPERATIONS_MANAGER', 'SALES_MANAGER', 'MEMBER');

-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'pro_trial',
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "public"."StripeAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "accessTokenEncrypted" BYTEA,
    "refreshToken" TEXT,
    "accountType" TEXT NOT NULL DEFAULT 'standard',
    "email" TEXT,
    "businessName" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeCustomer" (
    "id" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeSubscription" (
    "id" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "planName" TEXT,
    "planAmount" DECIMAL(65,30) NOT NULL,
    "planInterval" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeInvoice" (
    "id" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountDue" DECIMAL(65,30) NOT NULL,
    "amountPaid" DECIMAL(65,30) NOT NULL,
    "amountRemaining" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripePayment" (
    "id" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripePaymentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "description" TEXT,
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashflowMetric" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netCashflow" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "burnRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "runway" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "mrr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "arr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "growthRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cashBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "accountsReceivable" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "accountsPayable" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "activeCustomers" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "churnedCustomers" INTEGER NOT NULL DEFAULT 0,
    "customerAcquisitionCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lifetimeValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashflowMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIScenario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scenarioType" TEXT NOT NULL,
    "inputParameters" JSONB NOT NULL,
    "projectedRevenue" DECIMAL(65,30),
    "projectedExpenses" DECIMAL(65,30),
    "projectedCashflow" DECIMAL(65,30),
    "projectedRunway" DECIMAL(65,30),
    "confidence" DECIMAL(65,30),
    "insights" JSONB,
    "recommendations" JSONB,
    "risks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "currentValue" DECIMAL(65,30),
    "thresholdValue" DECIMAL(65,30),
    "recommendations" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvestorUpdate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "highlights" JSONB NOT NULL,
    "challenges" JSONB NOT NULL,
    "nextSteps" JSONB NOT NULL,
    "revenueGrowth" DECIMAL(65,30),
    "burnRate" DECIMAL(65,30),
    "runway" DECIMAL(65,30),
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "costPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30),
    "notes" TEXT,
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SimulatedTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "category" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulatedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeAccount_stripeAccountId_key" ON "public"."StripeAccount"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_stripeCustomerId_key" ON "public"."StripeCustomer"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscription_stripeSubscriptionId_key" ON "public"."StripeSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeInvoice_stripeInvoiceId_key" ON "public"."StripeInvoice"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "StripePayment_stripePaymentId_key" ON "public"."StripePayment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "CashflowMetric_tenantId_periodStart_idx" ON "public"."CashflowMetric"("tenantId", "periodStart");

-- CreateIndex
CREATE INDEX "AIScenario_tenantId_createdAt_idx" ON "public"."AIScenario"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_tenantId_createdAt_idx" ON "public"."Alert"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_tenantId_isRead_idx" ON "public"."Alert"("tenantId", "isRead");

-- CreateIndex
CREATE INDEX "InvestorUpdate_tenantId_periodStart_idx" ON "public"."InvestorUpdate"("tenantId", "periodStart");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "public"."Product"("tenantId");

-- CreateIndex
CREATE INDEX "ProductTransaction_tenantId_createdAt_idx" ON "public"."ProductTransaction"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductTransaction_productId_idx" ON "public"."ProductTransaction"("productId");

-- CreateIndex
CREATE INDEX "SimulatedTransaction_tenantId_date_idx" ON "public"."SimulatedTransaction"("tenantId", "date");

-- AddForeignKey
ALTER TABLE "public"."StripeAccount" ADD CONSTRAINT "StripeAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripeCustomer" ADD CONSTRAINT "StripeCustomer_stripeAccountId_fkey" FOREIGN KEY ("stripeAccountId") REFERENCES "public"."StripeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripeSubscription" ADD CONSTRAINT "StripeSubscription_stripeAccountId_fkey" FOREIGN KEY ("stripeAccountId") REFERENCES "public"."StripeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripeSubscription" ADD CONSTRAINT "StripeSubscription_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "public"."StripeCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripeInvoice" ADD CONSTRAINT "StripeInvoice_stripeAccountId_fkey" FOREIGN KEY ("stripeAccountId") REFERENCES "public"."StripeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripeInvoice" ADD CONSTRAINT "StripeInvoice_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "public"."StripeCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripePayment" ADD CONSTRAINT "StripePayment_stripeAccountId_fkey" FOREIGN KEY ("stripeAccountId") REFERENCES "public"."StripeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripePayment" ADD CONSTRAINT "StripePayment_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "public"."StripeCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashflowMetric" ADD CONSTRAINT "CashflowMetric_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIScenario" ADD CONSTRAINT "AIScenario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvestorUpdate" ADD CONSTRAINT "InvestorUpdate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTransaction" ADD CONSTRAINT "ProductTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTransaction" ADD CONSTRAINT "ProductTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SimulatedTransaction" ADD CONSTRAINT "SimulatedTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

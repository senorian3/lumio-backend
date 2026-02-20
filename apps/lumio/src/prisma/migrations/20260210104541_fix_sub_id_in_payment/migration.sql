-- DropForeignKey
ALTER TABLE "Payments" DROP CONSTRAINT "Payments_subscriptionId_fkey";

-- AlterTable
ALTER TABLE "Payments" ALTER COLUMN "subscriptionId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("subscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

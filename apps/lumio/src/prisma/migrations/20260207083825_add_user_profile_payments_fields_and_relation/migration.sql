/*
  Warnings:

  - You are about to drop the column `userProfileId` on the `Payments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subscriptionId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currency` to the `Payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userProfileId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payments" DROP CONSTRAINT "Payments_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_paymentId_fkey";

-- DropIndex
DROP INDEX "Subscription_paymentId_key";

-- AlterTable
ALTER TABLE "Payments" DROP COLUMN "userProfileId",
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "subscriptionId" INTEGER;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "paymentId",
ADD COLUMN     "cancelledAt" TIMESTAMP(0),
ADD COLUMN     "subscriptionId" TEXT NOT NULL,
ADD COLUMN     "userProfileId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriptionId_key" ON "Subscription"("subscriptionId");

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

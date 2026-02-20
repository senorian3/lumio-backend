/*
  Warnings:

  - Made the column `paymentsService` on table `Payments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Payments" ALTER COLUMN "paymentsService" SET NOT NULL,
ALTER COLUMN "paymentsService" SET DATA TYPE TEXT;

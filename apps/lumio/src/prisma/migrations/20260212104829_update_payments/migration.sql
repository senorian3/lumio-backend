/*
  Warnings:

  - Added the required column `datePayment` to the `Payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payments" ADD COLUMN     "datePayment" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL;

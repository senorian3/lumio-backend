/*
  Warnings:

  - Added the required column `executeAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "executeAt" TIMESTAMP(6) NOT NULL;

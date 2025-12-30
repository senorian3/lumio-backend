/*
  Warnings:

  - You are about to drop the `GitHub` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Google` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GitHub" DROP CONSTRAINT "GitHub_userId_fkey";

-- DropForeignKey
ALTER TABLE "Google" DROP CONSTRAINT "Google_userId_fkey";

-- DropTable
DROP TABLE "GitHub";

-- DropTable
DROP TABLE "Google";

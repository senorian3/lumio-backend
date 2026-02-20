/*
  Warnings:

  - The primary key for the `Payments` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Payments" DROP CONSTRAINT "Payments_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Payments_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Payments_id_seq";

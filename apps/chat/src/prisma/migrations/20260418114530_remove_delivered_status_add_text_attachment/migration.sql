/*
  Warnings:

  - The values [DELIVERED] on the enum `MessageStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "AttachmentType" ADD VALUE 'TEXT';

-- AlterEnum
BEGIN;
CREATE TYPE "MessageStatus_new" AS ENUM ('SENT', 'READ');
ALTER TABLE "public"."Message" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "status" TYPE "MessageStatus_new" USING ("status"::text::"MessageStatus_new");
ALTER TYPE "MessageStatus" RENAME TO "MessageStatus_old";
ALTER TYPE "MessageStatus_new" RENAME TO "MessageStatus";
DROP TYPE "public"."MessageStatus_old";
ALTER TABLE "Message" ALTER COLUMN "status" SET DEFAULT 'SENT';
COMMIT;

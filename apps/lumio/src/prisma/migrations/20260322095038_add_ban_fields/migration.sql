-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banReason" VARCHAR(255),
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

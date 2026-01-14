-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileFilled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileFilledAt" TIMESTAMP(3),
ADD COLUMN     "profileUpdatedAt" TIMESTAMP(0),
ALTER COLUMN "dateOfBirth" SET DATA TYPE TIMESTAMP(0);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aboutMe" VARCHAR(200),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(100),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" VARCHAR(100),
ADD COLUMN     "lastName" VARCHAR(100);

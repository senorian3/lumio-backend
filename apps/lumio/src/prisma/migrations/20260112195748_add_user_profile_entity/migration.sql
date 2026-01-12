/*
  Warnings:

  - You are about to drop the column `aboutMe` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileFilled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileFilledAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileUpdatedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "aboutMe",
DROP COLUMN "avatarUrl",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "dateOfBirth",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "profileFilled",
DROP COLUMN "profileFilledAt",
DROP COLUMN "profileUpdatedAt";

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "dateOfBirth" TIMESTAMP(0),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "aboutMe" VARCHAR(200),
    "avatarUrl" TEXT,
    "profileFilled" BOOLEAN NOT NULL DEFAULT false,
    "profileFilledAt" TIMESTAMP(3),
    "profileUpdatedAt" TIMESTAMP(0),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

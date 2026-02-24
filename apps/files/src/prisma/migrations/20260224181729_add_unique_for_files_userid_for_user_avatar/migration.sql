/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `UserAvatar` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserAvatar_userId_key" ON "UserAvatar"("userId");

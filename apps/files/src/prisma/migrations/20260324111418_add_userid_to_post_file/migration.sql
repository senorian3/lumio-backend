-- AlterTable
ALTER TABLE "PostFile" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "PostFile_userId_idx" ON "PostFile"("userId");

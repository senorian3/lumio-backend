-- CreateIndex
CREATE INDEX "PostFile_postId_idx" ON "PostFile"("postId");

-- CreateIndex
CREATE INDEX "PostFile_deletedAt_idx" ON "PostFile"("deletedAt");

-- CreateIndex
CREATE INDEX "UserAvatar_userId_idx" ON "UserAvatar"("userId");

-- CreateIndex
CREATE INDEX "UserAvatar_deletedAt_idx" ON "UserAvatar"("deletedAt");

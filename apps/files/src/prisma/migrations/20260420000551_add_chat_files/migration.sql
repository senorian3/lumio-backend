-- CreateTable
CREATE TABLE "ChatFile" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "userId" INTEGER,
    "chatId" INTEGER,
    "messageId" TEXT,

    CONSTRAINT "ChatFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatFile_key_key" ON "ChatFile"("key");

-- CreateIndex
CREATE INDEX "ChatFile_deletedAt_idx" ON "ChatFile"("deletedAt");

-- CreateIndex
CREATE INDEX "ChatFile_userId_idx" ON "ChatFile"("userId");

-- CreateIndex
CREATE INDEX "ChatFile_chatId_idx" ON "ChatFile"("chatId");

-- CreateIndex
CREATE INDEX "ChatFile_messageId_idx" ON "ChatFile"("messageId");

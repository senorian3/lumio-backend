-- CreateTable
CREATE TABLE "OutboxMessage" (
    "id" SERIAL NOT NULL,
    "aggregateId" INTEGER NOT NULL,
    "aggregateType" VARCHAR(50) NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "ttl" TIMESTAMP(3),

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboxMessage_status_scheduledAt_idx" ON "OutboxMessage"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutboxMessage_ttl_idx" ON "OutboxMessage"("ttl");
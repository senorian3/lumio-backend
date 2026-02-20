-- CreateIndex
CREATE INDEX "Payment_profileId_idx" ON "Payment"("profileId");

-- CreateIndex
CREATE INDEX "Payment_status_profileId_idx" ON "Payment"("status", "profileId");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

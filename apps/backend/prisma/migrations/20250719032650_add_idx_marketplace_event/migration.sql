-- CreateIndex
CREATE INDEX "marketplace_events_entityId_idx" ON "marketplace_events"("entityId");

-- CreateIndex
CREATE INDEX "marketplace_events_userId_idx" ON "marketplace_events"("userId");

-- CreateIndex
CREATE INDEX "marketplace_events_eventType_idx" ON "marketplace_events"("eventType");

-- CreateIndex
CREATE INDEX "marketplace_events_timestamp_idx" ON "marketplace_events"("timestamp");

-- CreateIndex
CREATE INDEX "marketplace_events_entityId_timestamp_idx" ON "marketplace_events"("entityId", "timestamp");

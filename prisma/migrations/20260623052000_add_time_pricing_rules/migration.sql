-- CreateTable
CREATE TABLE "TimePricingRule" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "turfSettingsId" TEXT NOT NULL,

    CONSTRAINT "TimePricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimePricingRule_turfSettingsId_idx" ON "TimePricingRule"("turfSettingsId");

-- AddForeignKey
ALTER TABLE "TimePricingRule" ADD CONSTRAINT "TimePricingRule_turfSettingsId_fkey" FOREIGN KEY ("turfSettingsId") REFERENCES "TurfSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "PartyRoom" ADD COLUMN     "featureKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PartyRoom_featureKey_key" ON "PartyRoom"("featureKey");


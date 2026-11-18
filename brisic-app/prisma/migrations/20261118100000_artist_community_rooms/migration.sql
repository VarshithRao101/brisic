-- AlterTable
ALTER TABLE "PartyRoom" ADD COLUMN     "artistId" TEXT,
ALTER COLUMN "hostId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PartyRoom_artistId_key" ON "PartyRoom"("artistId");


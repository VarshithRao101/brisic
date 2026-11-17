-- CreateTable
CREATE TABLE "PartyRoom" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "chatOpen" BOOLEAN NOT NULL DEFAULT true,
    "nowItemId" TEXT,
    "nowStarted" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartyRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyQueueItem" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "addedById" TEXT NOT NULL,
    "addedByName" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "playedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyVote" (
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PartyVote_pkey" PRIMARY KEY ("itemId","userId")
);

-- CreateTable
CREATE TABLE "PartyMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartyRoom_code_key" ON "PartyRoom"("code");

-- CreateIndex
CREATE INDEX "PartyRoom_isPublic_endedAt_updatedAt_idx" ON "PartyRoom"("isPublic", "endedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "PartyRoom_hostId_idx" ON "PartyRoom"("hostId");

-- CreateIndex
CREATE INDEX "PartyMember_userId_idx" ON "PartyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyMember_roomId_userId_key" ON "PartyMember"("roomId", "userId");

-- CreateIndex
CREATE INDEX "PartyQueueItem_roomId_playedAt_idx" ON "PartyQueueItem"("roomId", "playedAt");

-- CreateIndex
CREATE INDEX "PartyMessage_roomId_createdAt_idx" ON "PartyMessage"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "PartyRoom" ADD CONSTRAINT "PartyRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyMember" ADD CONSTRAINT "PartyMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PartyRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyMember" ADD CONSTRAINT "PartyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyQueueItem" ADD CONSTRAINT "PartyQueueItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PartyRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyVote" ADD CONSTRAINT "PartyVote_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PartyQueueItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyMessage" ADD CONSTRAINT "PartyMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PartyRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;


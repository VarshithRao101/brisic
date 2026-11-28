-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "lyrics" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "premiumUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EditorialPlaylist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "shelf" TEXT NOT NULL,
    "artFrom" TEXT NOT NULL DEFAULT '#2f7a34',
    "artTo" TEXT NOT NULL DEFAULT '#10381a',
    "hero" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialPlaylistSong" (
    "playlistId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialPlaylistSong_pkey" PRIMARY KEY ("playlistId","songId")
);

-- CreateTable
CREATE TABLE "Exclusive" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "youtubeId" TEXT,
    "audioKey" TEXT,
    "audioType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exclusive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchItem" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceNaira" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageKey" TEXT,
    "buyUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditorialPlaylist_shelf_position_idx" ON "EditorialPlaylist"("shelf", "position");

-- CreateIndex
CREATE INDEX "EditorialPlaylistSong_playlistId_position_idx" ON "EditorialPlaylistSong"("playlistId", "position");

-- CreateIndex
CREATE INDEX "Exclusive_artistId_createdAt_idx" ON "Exclusive"("artistId", "createdAt");

-- CreateIndex
CREATE INDEX "MerchItem_artistId_createdAt_idx" ON "MerchItem"("artistId", "createdAt");

-- AddForeignKey
ALTER TABLE "EditorialPlaylistSong" ADD CONSTRAINT "EditorialPlaylistSong_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "EditorialPlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialPlaylistSong" ADD CONSTRAINT "EditorialPlaylistSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exclusive" ADD CONSTRAINT "Exclusive_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchItem" ADD CONSTRAINT "MerchItem_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


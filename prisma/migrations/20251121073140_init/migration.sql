-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('CLIP', 'FULL');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('GAME', 'EMOTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_CLIP', 'MENTION', 'COMMENT', 'WATCH_PARTY', 'NEW_FOLLOWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoType" "VideoType" NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'PROCESSING',
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "previewUrl" TEXT,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "parentVideoId" TEXT,
    "clipStartTime" DOUBLE PRECISION,
    "clipEndTime" DOUBLE PRECISION,
    "responseToId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "clippedById" TEXT,
    "gameId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "clipCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "povGroupId" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "videoTimestamp" DOUBLE PRECISION,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TagType" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTag" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchParty" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "name" TEXT,
    "videoId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "WatchParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchPartyParticipant" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "WatchPartyParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoView" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "watchDuration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Video_uploaderId_idx" ON "Video"("uploaderId");

-- CreateIndex
CREATE INDEX "Video_videoType_idx" ON "Video"("videoType");

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- CreateIndex
CREATE INDEX "Video_gameId_idx" ON "Video"("gameId");

-- CreateIndex
CREATE INDEX "Video_parentVideoId_idx" ON "Video"("parentVideoId");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");

-- CreateIndex
CREATE INDEX "Video_povGroupId_idx" ON "Video"("povGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_slug_idx" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Comment_videoId_idx" ON "Comment"("videoId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Like_videoId_idx" ON "Like"("videoId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_videoId_userId_key" ON "Like"("videoId", "userId");

-- CreateIndex
CREATE INDEX "Tag_type_idx" ON "Tag"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_type_key" ON "Tag"("slug", "type");

-- CreateIndex
CREATE INDEX "VideoTag_videoId_idx" ON "VideoTag"("videoId");

-- CreateIndex
CREATE INDEX "VideoTag_tagId_idx" ON "VideoTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoTag_videoId_tagId_key" ON "VideoTag"("videoId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchParty_roomCode_key" ON "WatchParty"("roomCode");

-- CreateIndex
CREATE INDEX "WatchParty_roomCode_idx" ON "WatchParty"("roomCode");

-- CreateIndex
CREATE INDEX "WatchParty_hostId_idx" ON "WatchParty"("hostId");

-- CreateIndex
CREATE INDEX "WatchParty_isActive_idx" ON "WatchParty"("isActive");

-- CreateIndex
CREATE INDEX "WatchPartyParticipant_partyId_idx" ON "WatchPartyParticipant"("partyId");

-- CreateIndex
CREATE INDEX "WatchPartyParticipant_userId_idx" ON "WatchPartyParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchPartyParticipant_partyId_userId_key" ON "WatchPartyParticipant"("partyId", "userId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "VideoView_videoId_idx" ON "VideoView"("videoId");

-- CreateIndex
CREATE INDEX "VideoView_userId_idx" ON "VideoView"("userId");

-- CreateIndex
CREATE INDEX "VideoView_createdAt_idx" ON "VideoView"("createdAt");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_parentVideoId_fkey" FOREIGN KEY ("parentVideoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_responseToId_fkey" FOREIGN KEY ("responseToId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_clippedById_fkey" FOREIGN KEY ("clippedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTag" ADD CONSTRAINT "VideoTag_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTag" ADD CONSTRAINT "VideoTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchParty" ADD CONSTRAINT "WatchParty_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchParty" ADD CONSTRAINT "WatchParty_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchPartyParticipant" ADD CONSTRAINT "WatchPartyParticipant_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "WatchParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchPartyParticipant" ADD CONSTRAINT "WatchPartyParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "workflowStatus" TEXT DEFAULT 'pending',
    "workflowLocation" TEXT,
    "originalPath" TEXT,
    "currentPath" TEXT,
    "assetsMoved" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "movedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PublishRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "hashId" TEXT,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublishRecord_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TitleInjectionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'after_title',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PostInjectionOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "content" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_postId_key" ON "Post"("postId");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "Post_postId_idx" ON "Post"("postId");

-- CreateIndex
CREATE INDEX "Post_workflowStatus_idx" ON "Post"("workflowStatus");

-- CreateIndex
CREATE INDEX "PublishRecord_postId_idx" ON "PublishRecord"("postId");

-- CreateIndex
CREATE INDEX "PublishRecord_platform_idx" ON "PublishRecord"("platform");

-- CreateIndex
CREATE INDEX "OperationLog_postId_idx" ON "OperationLog"("postId");

-- CreateIndex
CREATE INDEX "TitleInjectionRule_platform_idx" ON "TitleInjectionRule"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "PostInjectionOverride_postId_key" ON "PostInjectionOverride"("postId");

-- CreateIndex
CREATE INDEX "PostInjectionOverride_postId_idx" ON "PostInjectionOverride"("postId");

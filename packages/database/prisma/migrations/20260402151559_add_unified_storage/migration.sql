-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TagCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedKeywords" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "tags" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "prev" TEXT,
    "next" TEXT,
    "related" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformIdMapping" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformPostId" TEXT NOT NULL,
    "url" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "Config"("key");

-- CreateIndex
CREATE INDEX "Config_category_idx" ON "Config"("category");

-- CreateIndex
CREATE INDEX "Config_key_idx" ON "Config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TagCache_tag_key" ON "TagCache"("tag");

-- CreateIndex
CREATE INDEX "TagCache_tag_idx" ON "TagCache"("tag");

-- CreateIndex
CREATE INDEX "TagCache_count_idx" ON "TagCache"("count");

-- CreateIndex
CREATE INDEX "ContentIndex_date_idx" ON "ContentIndex"("date");

-- CreateIndex
CREATE INDEX "ContentIndex_draft_idx" ON "ContentIndex"("draft");

-- CreateIndex
CREATE INDEX "PlatformIdMapping_postId_idx" ON "PlatformIdMapping"("postId");

-- CreateIndex
CREATE INDEX "PlatformIdMapping_platform_idx" ON "PlatformIdMapping"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformIdMapping_postId_platform_key" ON "PlatformIdMapping"("postId", "platform");

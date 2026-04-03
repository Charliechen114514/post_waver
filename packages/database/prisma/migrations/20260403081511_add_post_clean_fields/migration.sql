-- AlterTable
ALTER TABLE "Post" ADD COLUMN "cleanedAt" DATETIME;
ALTER TABLE "Post" ADD COLUMN "tags" TEXT;

-- CreateIndex
CREATE INDEX "Post_cleanedAt_idx" ON "Post"("cleanedAt");

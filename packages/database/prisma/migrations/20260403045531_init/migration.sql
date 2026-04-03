-- CreateTable
CREATE TABLE "InjectionTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "InjectionTemplate_name_key" ON "InjectionTemplate"("name");

-- CreateIndex
CREATE INDEX "InjectionTemplate_enabled_idx" ON "InjectionTemplate"("enabled");

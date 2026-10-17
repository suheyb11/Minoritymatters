-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "instagramUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "linkedinUrl" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL DEFAULT '',
    "peopleReached" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT NOT NULL DEFAULT '',
    "gallery" TEXT NOT NULL DEFAULT '',
    "relatedService" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

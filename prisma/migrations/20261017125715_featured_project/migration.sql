-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "featuredHeadline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

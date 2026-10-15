-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "founderIntro" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "founderName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "founderPhoto" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "founderRole" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "founderTranscript" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "founderVideoUrl" TEXT NOT NULL DEFAULT '';

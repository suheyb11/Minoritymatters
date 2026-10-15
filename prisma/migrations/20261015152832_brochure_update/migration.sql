-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "reason" TEXT NOT NULL DEFAULT 'General enquiry';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'programme';

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "communityLine" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "referralText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whoWeAre" TEXT NOT NULL DEFAULT '';

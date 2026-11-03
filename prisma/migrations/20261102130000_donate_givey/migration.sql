-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "bookingNotifyEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "donateGiveyUrl" TEXT NOT NULL DEFAULT '';

-- The charity's Givey page, like the WordPress website (it can be changed in Admin > Site settings)
UPDATE "Setting" SET "donateGiveyUrl" = 'https://www.givey.com/share?charity_id=minoritymattersltd&client_id=lSaVLTJm5um0uTE2q4VeEIbfxmLAy6x6vHOKfdKU' WHERE "id" = 1;

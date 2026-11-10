-- Made with: prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- Then every TEXT default was put in brackets (DEFAULT ('')): MySQL 8 only accepts TEXT defaults written that way; MariaDB accepts both.

-- CreateTable
CREATE TABLE `Setting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `heroTagline` TEXT NOT NULL DEFAULT (''),
    `introHeading` TEXT NOT NULL DEFAULT (''),
    `introSubtitle` TEXT NOT NULL DEFAULT (''),
    `introText` TEXT NOT NULL DEFAULT (''),
    `address` TEXT NOT NULL DEFAULT (''),
    `phone` TEXT NOT NULL DEFAULT (''),
    `email` TEXT NOT NULL DEFAULT (''),
    `pressEmail` TEXT NOT NULL DEFAULT (''),
    `charityNumber` TEXT NOT NULL DEFAULT (''),
    `donateUrl` TEXT NOT NULL DEFAULT (''),
    `tiktokUrl` TEXT NOT NULL DEFAULT (''),
    `xUrl` TEXT NOT NULL DEFAULT (''),
    `facebookUrl` TEXT NOT NULL DEFAULT (''),
    `youtubeUrl` TEXT NOT NULL DEFAULT (''),
    `instagramUrl` TEXT NOT NULL DEFAULT (''),
    `linkedinUrl` TEXT NOT NULL DEFAULT (''),
    `aboutLead` TEXT NOT NULL DEFAULT (''),
    `aboutStory` TEXT NOT NULL DEFAULT (''),
    `vision` TEXT NOT NULL DEFAULT (''),
    `mission` TEXT NOT NULL DEFAULT (''),
    `whoWeAre` TEXT NOT NULL DEFAULT (''),
    `referralText` TEXT NOT NULL DEFAULT (''),
    `tagline` TEXT NOT NULL DEFAULT (''),
    `communityLine` TEXT NOT NULL DEFAULT (''),
    `founderName` TEXT NOT NULL DEFAULT (''),
    `founderRole` TEXT NOT NULL DEFAULT (''),
    `founderPhoto` TEXT NOT NULL DEFAULT (''),
    `founderVideoUrl` TEXT NOT NULL DEFAULT (''),
    `founderIntro` TEXT NOT NULL DEFAULT (''),
    `founderTranscript` TEXT NOT NULL DEFAULT (''),
    `contactNotifyEmail` TEXT NOT NULL DEFAULT (''),
    `bookingNotifyEmail` TEXT NOT NULL DEFAULT (''),
    `donateGiveyUrl` TEXT NOT NULL DEFAULT (''),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL DEFAULT (''),
    `intro` TEXT NOT NULL DEFAULT (''),
    `points` TEXT NOT NULL DEFAULT (''),
    `outro` TEXT NOT NULL DEFAULT (''),
    `icon` VARCHAR(500) NOT NULL DEFAULT '/images/icons/promotion.svg',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `kind` VARCHAR(20) NOT NULL DEFAULT 'programme',

    UNIQUE INDEX `Service_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `period` VARCHAR(50) NOT NULL DEFAULT '',
    `category` VARCHAR(100) NOT NULL DEFAULT '',
    `summary` TEXT NOT NULL DEFAULT (''),
    `body` TEXT NOT NULL DEFAULT (''),
    `stats` TEXT NOT NULL DEFAULT (''),
    `peopleReached` INTEGER NOT NULL DEFAULT 0,
    `coverImage` TEXT NOT NULL DEFAULT (''),
    `gallery` TEXT NOT NULL DEFAULT (''),
    `relatedService` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `featuredHeadline` TEXT NOT NULL DEFAULT (''),

    UNIQUE INDEX `Project_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Value` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` TEXT NOT NULL,
    `text` TEXT NOT NULL DEFAULT (''),
    `icon` TEXT NOT NULL DEFAULT (''),
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PressItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` TEXT NOT NULL,
    `source` TEXT NOT NULL DEFAULT (''),
    `url` TEXT NOT NULL,
    `image` TEXT NOT NULL DEFAULT (''),
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NOT NULL DEFAULT (''),
    `body` MEDIUMTEXT NOT NULL DEFAULT (''),
    `coverImage` TEXT NOT NULL DEFAULT (''),
    `author` VARCHAR(191) NOT NULL DEFAULT 'Minority Matters',
    `published` BOOLEAN NOT NULL DEFAULT true,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Post_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Funder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `logo` TEXT NOT NULL DEFAULT (''),
    `url` TEXT NOT NULL DEFAULT (''),
    `showLogo` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(100) NOT NULL DEFAULT '',
    `message` MEDIUMTEXT NOT NULL,
    `reason` VARCHAR(100) NOT NULL DEFAULT 'General enquiry',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subject` TEXT NOT NULL DEFAULT (''),
    `messageId` TEXT NOT NULL DEFAULT (''),

    INDEX `Message_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reply` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `subject` TEXT NOT NULL,
    `body` MEDIUMTEXT NOT NULL,
    `files` TEXT NOT NULL DEFAULT ('[]'),
    `sent` BOOLEAN NOT NULL DEFAULT false,
    `authorName` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Reply_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MailConfig` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `user` VARCHAR(191) NOT NULL DEFAULT '',
    `fromAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `pass` TEXT NOT NULL DEFAULT (''),
    `host` VARCHAR(191) NOT NULL DEFAULT 'smtp.gmail.com',
    `port` INTEGER NOT NULL DEFAULT 587,
    `lastError` TEXT NOT NULL DEFAULT (''),
    `imapError` TEXT NOT NULL DEFAULT (''),
    `lastSyncAt` DATETIME(3) NULL,
    `seen` MEDIUMTEXT NOT NULL DEFAULT (''),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RateHit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RateHit_key_createdAt_idx`(`key`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL DEFAULT (''),
    `body` MEDIUMTEXT NOT NULL DEFAULT (''),
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `location` TEXT NOT NULL DEFAULT (''),
    `address` TEXT NOT NULL DEFAULT (''),
    `audience` VARCHAR(100) NOT NULL DEFAULT 'Everyone',
    `ageMin` INTEGER NULL,
    `ageMax` INTEGER NULL,
    `price` VARCHAR(191) NOT NULL DEFAULT 'Free',
    `capacity` INTEGER NULL,
    `bookingType` VARCHAR(20) NOT NULL DEFAULT 'form',
    `bookingUrl` TEXT NOT NULL DEFAULT (''),
    `bookingClosesAt` DATETIME(3) NULL,
    `coverImage` TEXT NOT NULL DEFAULT (''),
    `projectSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `published` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Event_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `name` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(100) NOT NULL DEFAULT '',
    `adults` INTEGER NOT NULL DEFAULT 1,
    `children` INTEGER NOT NULL DEFAULT 0,
    `childAges` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` TEXT NOT NULL DEFAULT (''),
    `status` VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Booking_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


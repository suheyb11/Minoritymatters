-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "contactNotifyEmail" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "messageId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subject" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Reply" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "files" JSONB NOT NULL DEFAULT '[]',
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "user" TEXT NOT NULL DEFAULT '',
    "fromAddress" TEXT NOT NULL DEFAULT '',
    "pass" TEXT NOT NULL DEFAULT '',
    "host" TEXT NOT NULL DEFAULT 'smtp.gmail.com',
    "port" INTEGER NOT NULL DEFAULT 587,
    "lastError" TEXT NOT NULL DEFAULT '',
    "imapError" TEXT NOT NULL DEFAULT '',
    "lastSyncAt" TIMESTAMP(3),
    "seen" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateHit" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reply_email_idx" ON "Reply"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "RateHit_key_createdAt_idx" ON "RateHit"("key", "createdAt");

-- CreateIndex
CREATE INDEX "Message_email_idx" ON "Message"("email");


-- Row Level Security for the new tables, like the other tables (no policies: Supabase's public API cannot use them)
ALTER TABLE "Reply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MailConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateHit" ENABLE ROW LEVEL SECURITY;

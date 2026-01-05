-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "msgmanager";

-- CreateEnum
CREATE TYPE "msgmanager"."UserRole" AS ENUM ('STAFF', 'STAFF_ADMIN', 'ADMIN', 'CHIEF_COUNCIL');

-- CreateEnum
CREATE TYPE "msgmanager"."Department" AS ENUM ('BAND_OFFICE', 'J_W_HEALTH_CENTER', 'CSCMEC', 'COUNCIL', 'RECREATION', 'UTILITIES');

-- CreateEnum
CREATE TYPE "msgmanager"."Categories" AS ENUM ('CHIEFNCOUNCIL', 'HEALTH', 'EDUCATION', 'RECREATION', 'EMPLOYMENT', 'PROGRAM_EVENTS', 'ANNOUNCEMENTS');

-- CreateEnum
CREATE TYPE "msgmanager"."FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'DATE', 'NUMBER', 'EMAIL', 'PHONE');

-- CreateTable
CREATE TABLE "msgmanager"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" "msgmanager"."Department" NOT NULL DEFAULT 'BAND_OFFICE',
    "role" "msgmanager"."UserRole" NOT NULL DEFAULT 'STAFF',
    "pin" TEXT,
    "pinExpiresAt" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordResetRequested" TIMESTAMP(3),
    "passwordResetCompleted" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."LoginLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" "msgmanager"."Department" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failReason" TEXT,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT,
    "refresh_token" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."SmsLog" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" TEXT NOT NULL,
    "messageIds" TEXT[],
    "error" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."EmailLog" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "attachments" JSONB,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."StaffEmailLog" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "attachments" JSONB,
    "userId" TEXT NOT NULL,

    CONSTRAINT "StaffEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."BulletinApiLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "poster_url" TEXT NOT NULL,
    "category" "msgmanager"."Categories" NOT NULL DEFAULT 'CHIEFNCOUNCIL',
    "userId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulletinApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."MsgCnC" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'notice',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "MsgCnC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."SignUpForm" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "maxEntries" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignUpForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."FormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "msgmanager"."FieldType" NOT NULL,
    "options" TEXT,
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "msgmanager"."FormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "memberId" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "responses" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "msgmanager"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "msgmanager"."Session"("sessionToken");

-- AddForeignKey
ALTER TABLE "msgmanager"."LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "msgmanager"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "msgmanager"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."SmsLog" ADD CONSTRAINT "SmsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "msgmanager"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "msgmanager"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."StaffEmailLog" ADD CONSTRAINT "StaffEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "msgmanager"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."BulletinApiLog" ADD CONSTRAINT "BulletinApiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "msgmanager"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."MsgCnC" ADD CONSTRAINT "MsgCnC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "msgmanager"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."FormField" ADD CONSTRAINT "FormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "msgmanager"."SignUpForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "msgmanager"."FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "msgmanager"."SignUpForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

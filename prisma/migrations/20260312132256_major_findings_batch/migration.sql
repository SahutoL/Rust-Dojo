-- CreateEnum
CREATE TYPE "TrackAvailability" AS ENUM ('AVAILABLE', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "ProblemCompletionMethod" AS ENUM ('AC', 'EXPLANATION_VIEWED');

-- AlterTable
ALTER TABLE "lesson_sections" ADD COLUMN     "is_required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "payload_json" JSONB;

-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "estimated_minutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "track_id" TEXT;

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "availability" "TrackAvailability" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "gradient" TEXT,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "launch_note" TEXT,
ADD COLUMN     "roadmap_topics_json" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "problem_lessons" (
    "problem_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,

    CONSTRAINT "problem_lessons_pkey" PRIMARY KEY ("problem_id","lesson_id")
);

-- CreateTable
CREATE TABLE "lesson_section_progresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "status" "ProgressState" NOT NULL DEFAULT 'NOT_STARTED',
    "payload_json" JSONB,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lesson_section_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_learning_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "first_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "wa_count" INTEGER NOT NULL DEFAULT 0,
    "ce_count" INTEGER NOT NULL DEFAULT 0,
    "long_time_count" INTEGER NOT NULL DEFAULT 0,
    "explanation_viewed_at" TIMESTAMP(3),
    "completion_method" "ProblemCompletionMethod",

    CONSTRAINT "problem_learning_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_section_progresses_user_id_section_id_key" ON "lesson_section_progresses"("user_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "problem_learning_stats_user_id_problem_id_key" ON "problem_learning_stats"("user_id", "problem_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_lessons" ADD CONSTRAINT "problem_lessons_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_lessons" ADD CONSTRAINT "problem_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_section_progresses" ADD CONSTRAINT "lesson_section_progresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_section_progresses" ADD CONSTRAINT "lesson_section_progresses_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_section_progresses" ADD CONSTRAINT "lesson_section_progresses_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "lesson_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_learning_stats" ADD CONSTRAINT "problem_learning_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_learning_stats" ADD CONSTRAINT "problem_learning_stats_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

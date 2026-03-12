-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PrimaryGoal" AS ENUM ('PROGRAMMING_BASICS', 'RUST_INTRO', 'RUST_PRACTICAL', 'ATCODER', 'OSS', 'CAREER');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('EXPLANATION', 'DIAGRAM', 'QUIZ', 'CODE_EXECUTION', 'BUG_FIX', 'OUTPUT_PREDICTION', 'FILL_IN_BLANK', 'SUMMARY');

-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('MULTIPLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE', 'REORDER', 'FILL_IN_BLANK', 'OUTPUT_PREDICTION', 'CODE_READING', 'BUG_FIX', 'REFACTORING', 'IMPLEMENTATION', 'SUBMISSION', 'COMPILE_ERROR_FIX', 'OWNERSHIP_FIX', 'BORROW_CHECKER_READING', 'COMPILER_MESSAGE_INTERPRET', 'PRACTICAL_IMPROVEMENT', 'COMPETITIVE_OPTIMIZATION');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('SAMPLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'RUNNING', 'AC', 'WA', 'CE', 'RE', 'TLE', 'MLE', 'OLE', 'INTERNAL_ERROR');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('LESSON', 'PROBLEM');

-- CreateEnum
CREATE TYPE "ProgressState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReviewReasonType" AS ENUM ('WRONG_ANSWER', 'COMPILE_ERROR', 'LONG_TIME', 'EXPLANATION_VIEWED', 'PERIODIC_REVIEW');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('NEXT_LESSON', 'REVIEW_CONCEPT', 'SOLVE_PROBLEM', 'COMPETITIVE_SET', 'PRACTICAL_TASK');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STUDY_REMINDER', 'REVIEW_REMINDER', 'NEW_LESSON', 'MOCK_EXAM', 'ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "skill_level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "primary_goal" "PrimaryGoal" NOT NULL DEFAULT 'RUST_INTRO',
    "daily_minutes_goal" INTEGER NOT NULL DEFAULT 30,
    "onboarding_result" JSONB,
    "preferences_json" JSONB,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 10,
    "summary" TEXT,
    "content" TEXT,
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_sections" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "section_type" "SectionType" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lesson_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "type" "ProblemType" NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "constraints_text" TEXT,
    "input_format" TEXT,
    "output_format" TEXT,
    "solution_outline" TEXT,
    "hint_text" TEXT,
    "explanation_text" TEXT,
    "initial_code" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_test_cases" (
    "id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "case_type" "CaseType" NOT NULL DEFAULT 'SAMPLE',
    "input_text" TEXT NOT NULL,
    "expected_output_text" TEXT NOT NULL,
    "time_limit_ms" INTEGER NOT NULL DEFAULT 2000,
    "memory_limit_kb" INTEGER NOT NULL DEFAULT 262144,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "problem_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'rust',
    "source_code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "total_time_ms" INTEGER,
    "total_memory_kb" INTEGER,
    "score" INTEGER,
    "compile_output" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_results" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "testcase_id" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "time_ms" INTEGER,
    "memory_kb" INTEGER,
    "stdout_text" TEXT,
    "stderr_text" TEXT,

    CONSTRAINT "submission_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "progress_state" "ProgressState" NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_queue_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_type" "EntityType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "reason_type" "ReviewReasonType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "review_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recommendation_type" "RecommendationType" NOT NULL,
    "target_type" "EntityType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_tags" (
    "problem_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "problem_tags_pkey" PRIMARY KEY ("problem_id","tag_id")
);

-- CreateTable
CREATE TABLE "lesson_tags" (
    "lesson_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "lesson_tags_pkey" PRIMARY KEY ("lesson_id","tag_id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition_json" JSONB,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "target_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_code_key" ON "tracks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "progresses_user_id_entity_type_entity_id_key" ON "progresses"("user_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_user_id_track_id_key" ON "course_enrollments"("user_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_user_id_key" ON "admin_users"("user_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sections" ADD CONSTRAINT "lesson_sections_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_test_cases" ADD CONSTRAINT "problem_test_cases_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_testcase_id_fkey" FOREIGN KEY ("testcase_id") REFERENCES "problem_test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresses" ADD CONSTRAINT "progresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresses" ADD CONSTRAINT "progresses_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresses" ADD CONSTRAINT "progress_problem_fk" FOREIGN KEY ("entity_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_tags" ADD CONSTRAINT "problem_tags_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_tags" ADD CONSTRAINT "problem_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

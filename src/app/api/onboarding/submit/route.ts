import { NextRequest, NextResponse } from "next/server";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import { syncRecommendationsForUserSafely } from "@/data/learningService";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildStoredOnboardingResult,
  diagnoseAnswers,
  isOnboardingAnswers,
  mapOnboardingAnswersToSkillLevel,
  mapDailyStudyTimeToMinutesGoal,
  mapOnboardingGoalToPrimaryGoal,
  serializeStoredOnboardingResult,
} from "@/lib/onboarding";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const answers = body?.answers;

    if (!isOnboardingAnswers(answers)) {
      return NextResponse.json(
        { error: "診断結果の形式が不正です。" },
        { status: 400 }
      );
    }

    const diagnosis = diagnoseAnswers(answers);
    const onboardingResult = serializeStoredOnboardingResult(
      buildStoredOnboardingResult(answers, diagnosis)
    ) as InputJsonValue;

    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        primaryGoal: mapOnboardingGoalToPrimaryGoal(answers.goal),
        skillLevel: mapOnboardingAnswersToSkillLevel(answers),
        dailyMinutesGoal: mapDailyStudyTimeToMinutesGoal(answers.daily_study_time),
        onboardingResult,
      },
      create: {
        userId: session.user.id,
        primaryGoal: mapOnboardingGoalToPrimaryGoal(answers.goal),
        skillLevel: mapOnboardingAnswersToSkillLevel(answers),
        dailyMinutesGoal: mapDailyStudyTimeToMinutesGoal(answers.daily_study_time),
        onboardingResult,
      },
    });

    await syncRecommendationsForUserSafely(
      session.user.id,
      "onboarding submit"
    );

    return NextResponse.json({
      recommendedTrackCode: diagnosis.track,
      recommendedTrackName: diagnosis.trackName,
      description: diagnosis.description,
    });
  } catch (error) {
    console.error("Onboarding submit error:", error);
    return NextResponse.json(
      { error: "診断結果の保存中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

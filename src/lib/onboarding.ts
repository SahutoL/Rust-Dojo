export type OnboardingPrimaryGoal =
  | "PROGRAMMING_BASICS"
  | "RUST_INTRO"
  | "RUST_PRACTICAL"
  | "ATCODER"
  | "OSS"
  | "CAREER";

export type OnboardingSkillLevel =
  | "BEGINNER"
  | "ELEMENTARY"
  | "INTERMEDIATE"
  | "ADVANCED";

export type OnboardingQuestionId =
  | "programming_experience"
  | "other_languages"
  | "rust_experience"
  | "goal"
  | "daily_study_time"
  | "pace"
  | "competitive_programming_experience"
  | "learning_style";

export interface OnboardingQuestion {
  id: OnboardingQuestionId;
  text: string;
  options: { value: string; label: string }[];
}

export interface OnboardingAnswers {
  programming_experience: string;
  other_languages: string;
  rust_experience: string;
  goal: string;
  daily_study_time: string;
  pace: string;
  competitive_programming_experience: string;
  learning_style: string;
}

export interface DiagnosisResult {
  track: string;
  trackName: string;
  description: string;
  slug: string;
}

export interface StoredOnboardingResult {
  answeredAt: string;
  answers: OnboardingAnswers;
  recommendedTrackCode: string;
  recommendedTrackName: string;
  description: string;
}

const TRACK_DISPLAY_NAMES: Record<string, string> = {
  track0: "Track 0: プログラミング前提",
  track1: "Track 1: Rust 入門",
  track2: "Track 2: Rust 実務",
  track3: "Track 3: AtCoder Rust",
};

function getTrackDisplayName(trackCode: string) {
  return TRACK_DISPLAY_NAMES[trackCode] ?? trackCode;
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "programming_experience",
    text: "プログラミングの経験はありますか？",
    options: [
      { value: "none", label: "経験なし" },
      { value: "beginner", label: "少し触ったことがある" },
      { value: "intermediate", label: "他言語で実務・個人開発の経験がある" },
      { value: "advanced", label: "複数言語で開発経験があり、設計にも慣れている" },
    ],
  },
  {
    id: "other_languages",
    text: "使ったことのある言語を選んでください。",
    options: [
      { value: "none", label: "なし" },
      { value: "python", label: "Python" },
      { value: "javascript", label: "JavaScript / TypeScript" },
      { value: "c_cpp", label: "C / C++" },
      { value: "java", label: "Java / Kotlin" },
      { value: "other", label: "その他" },
    ],
  },
  {
    id: "rust_experience",
    text: "Rust の経験はありますか？",
    options: [
      { value: "none", label: "まったく触ったことがない" },
      { value: "tried", label: "少し試したことがある" },
      { value: "basics", label: "基本文法は理解している" },
      { value: "intermediate", label: "所有権や借用も含めて理解している" },
    ],
  },
  {
    id: "goal",
    text: "Rust Dojo で何を達成したいですか？",
    options: [
      { value: "basics", label: "プログラミングの基礎を学びたい" },
      { value: "rust_intro", label: "Rust の基本を身につけたい" },
      { value: "practical", label: "Rust で実務的な開発ができるようになりたい" },
      { value: "atcoder", label: "AtCoder の問題を Rust で解きたい" },
      { value: "oss", label: "OSS に参加できる力をつけたい" },
      { value: "career", label: "就職・転職に活かせる形で学びたい" },
    ],
  },
  {
    id: "daily_study_time",
    text: "1 日に確保できる学習時間はどれくらいですか？",
    options: [
      { value: "15", label: "15 分前後" },
      { value: "30", label: "30 分前後" },
      { value: "60", label: "1 時間前後" },
      { value: "120", label: "2 時間以上" },
    ],
  },
  {
    id: "pace",
    text: "どのくらいのペースで進めたいですか？",
    options: [
      { value: "steady", label: "無理なく着実に進めたい" },
      { value: "standard", label: "標準的なペースで進めたい" },
      { value: "intensive", label: "短期間で集中して進めたい" },
    ],
  },
  {
    id: "competitive_programming_experience",
    text: "競技プログラミングの経験はありますか？",
    options: [
      { value: "none", label: "経験なし" },
      { value: "beginner", label: "少し触ったことがある" },
      { value: "experienced", label: "継続して取り組んだことがある" },
    ],
  },
  {
    id: "learning_style",
    text: "普段の学習スタイルに近いのはどれですか？",
    options: [
      { value: "read_first", label: "まず解説を読んで理解してから手を動かす" },
      { value: "try_first", label: "先にコードを書いてみて、詰まったら調べる" },
      { value: "problem_first", label: "問題を解くことで理解を深める" },
    ],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStoredAnswers(value: unknown): OnboardingAnswers | null {
  if (!isRecord(value)) {
    return null;
  }

  const programmingExperience = value.programming_experience;
  const otherLanguages = value.other_languages;
  const rustExperience = value.rust_experience;
  const goal = value.goal;
  const learningStyle = value.learning_style;

  if (
    typeof programmingExperience !== "string" ||
    typeof otherLanguages !== "string" ||
    typeof rustExperience !== "string" ||
    typeof goal !== "string" ||
    typeof learningStyle !== "string"
  ) {
    return null;
  }

  return {
    programming_experience: programmingExperience,
    other_languages: otherLanguages,
    rust_experience: rustExperience,
    goal,
    daily_study_time:
      typeof value.daily_study_time === "string" ? value.daily_study_time : "30",
    pace: typeof value.pace === "string" ? value.pace : "standard",
    competitive_programming_experience:
      typeof value.competitive_programming_experience === "string"
        ? value.competitive_programming_experience
        : "none",
    learning_style: learningStyle,
  };
}

export function isOnboardingAnswers(value: unknown): value is OnboardingAnswers {
  if (!isRecord(value)) {
    return false;
  }

  return onboardingQuestions.every(
    (question) => typeof value[question.id] === "string"
  );
}

export function diagnoseAnswers(answers: OnboardingAnswers): DiagnosisResult {
  const { programming_experience, rust_experience, goal } = answers;
  const buildResult = (trackCode: string, description: string): DiagnosisResult => {
    return {
      track: trackCode,
      trackName: getTrackDisplayName(trackCode),
      description,
      slug: trackCode,
    };
  };

  if (programming_experience === "none") {
    return buildResult(
      "track0",
      "コンピュータの仕組みから変数・型・制御構文まで、プログラミングの基礎を学びます。その後 Rust 入門へ進みます。"
    );
  }

  if (goal === "atcoder") {
    if (rust_experience === "none" || rust_experience === "tried") {
      return buildResult(
        "track1",
        "Rust の基本文法と所有権・借用を固めたあと、Track 3 の AtCoder Rust で入出力テンプレートや探索の基礎へ進みます。"
      );
    }

    return buildResult(
      "track3",
      "rustc 1.89.0 を前提に、AtCoder の入出力テンプレート、Vec、ソート、探索、全探索から競プロ向けの書き方を固めます。"
    );
  }

  if (goal === "practical" || goal === "oss" || goal === "career") {
    if (rust_experience === "basics" || rust_experience === "intermediate") {
      return buildResult(
        "track2",
        goal === "oss"
          ? "Rust の基本はできているため、準備中の Track 2 で Cargo 運用、crate 設計、テスト戦略を固めたあと、OSS 参加に必要な開発フローへ進むのが自然です。公開までは Track 1 の復習を並行するとつながりやすくなります。"
          : goal === "career"
            ? "Rust の基本はできているため、準備中の Track 2 で実務向けの Cargo 運用、設計、テスト戦略へ進み、就職・転職で説明できる開発フローを固めるのが自然です。公開までは Track 1 の復習を並行するとつながりやすくなります。"
            : "Rust の基本はできているため、準備中の Track 2 で実務向けの Cargo 運用、設計、テスト戦略へ進むのが自然です。公開までは Track 1 の復習を並行するとつながりやすくなります。"
      );
    }

    return buildResult(
      "track1",
      goal === "oss"
        ? "Rust の基本文法と所有権・借用を習得したあと、Track 2 の実務開発フローへ進み、OSS 参加につながる開発基礎を固める構成が合っています。"
        : goal === "career"
          ? "Rust の基本文法と所有権・借用を習得したあと、Track 2 の実務開発フローへ進み、就職・転職につながる土台を作る構成が合っています。"
          : "Rust の基本文法と所有権・借用を習得したあと、Track 2 の実務開発フローへ進む構成が合っています。"
    );
  }

  if (rust_experience === "basics" || rust_experience === "intermediate") {
    return buildResult(
      "track2",
      "基本文法は理解しているため、次は準備中の Track 2 で Cargo、テスト、lint、crate 設計へ進む想定です。公開までは Track 1 後半の土台にあたる内容を優先すると効果的です。"
    );
  }

  return buildResult(
    "track1",
    "let と mut から所有権・借用まで、Rust の中核概念を段階的に学びます。"
  );
}

export function mapOnboardingGoalToPrimaryGoal(
  goal: OnboardingAnswers["goal"]
): OnboardingPrimaryGoal {
  if (goal === "basics") return "PROGRAMMING_BASICS";
  if (goal === "practical") return "RUST_PRACTICAL";
  if (goal === "atcoder") return "ATCODER";
  if (goal === "oss") return "OSS";
  if (goal === "career") return "CAREER";
  return "RUST_INTRO";
}

export function mapDailyStudyTimeToMinutesGoal(
  dailyStudyTime: OnboardingAnswers["daily_study_time"]
) {
  if (dailyStudyTime === "15") return 15;
  if (dailyStudyTime === "60") return 60;
  if (dailyStudyTime === "120") return 120;
  return 30;
}

export function mapOnboardingAnswersToSkillLevel(
  answers: OnboardingAnswers
): OnboardingSkillLevel {
  if (answers.programming_experience === "none") {
    return "BEGINNER";
  }

  if (answers.rust_experience === "intermediate") {
    return "ADVANCED";
  }

  if (answers.rust_experience === "basics") {
    return "INTERMEDIATE";
  }

  return "ELEMENTARY";
}

export function buildStoredOnboardingResult(
  answers: OnboardingAnswers,
  diagnosis: DiagnosisResult
): StoredOnboardingResult {
  return {
    answeredAt: new Date().toISOString(),
    answers,
    recommendedTrackCode: diagnosis.track,
    recommendedTrackName: diagnosis.trackName,
    description: diagnosis.description,
  };
}

export function serializeStoredOnboardingResult(
  result: StoredOnboardingResult
): Record<string, unknown> {
  return {
    answeredAt: result.answeredAt,
    answers: { ...result.answers },
    recommendedTrackCode: result.recommendedTrackCode,
    recommendedTrackName: result.recommendedTrackName,
    description: result.description,
  };
}

export function parseStoredOnboardingResult(
  value: unknown
): StoredOnboardingResult | null {
  if (!isRecord(value)) {
    return null;
  }
  const answers = parseStoredAnswers(value.answers);

  if (!answers) {
    return null;
  }

  if (
    typeof value.answeredAt !== "string" ||
    typeof value.recommendedTrackCode !== "string" ||
    typeof value.recommendedTrackName !== "string" ||
    typeof value.description !== "string"
  ) {
    return null;
  }

  return {
    answeredAt: value.answeredAt,
    answers,
    recommendedTrackCode: value.recommendedTrackCode,
    recommendedTrackName: value.recommendedTrackName,
    description: value.description,
  };
}

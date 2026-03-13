import { getAccountSnapshot } from "@/lib/account";
import { parseAccountPreferences } from "@/lib/account-preferences";
import { NotificationType, prisma } from "@/lib/prisma";

export type NotificationTypeCode =
  | "STUDY_REMINDER"
  | "REVIEW_REMINDER"
  | "NEW_LESSON"
  | "MOCK_EXAM"
  | "ACHIEVEMENT";

export interface NotificationSnapshot {
  id: string;
  type: NotificationTypeCode;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionHref: string;
}

function getNotificationActionHref(type: NotificationType) {
  switch (type) {
    case NotificationType.REVIEW_REMINDER:
      return "/review";
    case NotificationType.NEW_LESSON:
      return "/learn";
    case NotificationType.ACHIEVEMENT:
      return "/profile";
    case NotificationType.MOCK_EXAM:
      return "/dashboard";
    case NotificationType.STUDY_REMINDER:
    default:
      return "/dashboard";
  }
}

function mapNotification(row: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}): NotificationSnapshot {
  return {
    id: row.id,
    type: row.type as NotificationTypeCode,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
    actionHref: getNotificationActionHref(row.type),
  };
}

async function resolveUserLastActivityAt(userId: string) {
  const latestProgress = await prisma.progress.findFirst({
    where: { userId },
    orderBy: { lastAccessedAt: "desc" },
    select: { lastAccessedAt: true },
  });
  const latestSubmission = await prisma.submission.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
    select: { submittedAt: true },
  });

  const timestamps = [
    latestProgress?.lastAccessedAt,
    latestSubmission?.submittedAt,
  ].filter((value): value is Date => value instanceof Date);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(
    Math.max(...timestamps.map((timestamp) => timestamp.getTime()))
  );
}

async function ensureSingleUnreadNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  cooldownHours?: number;
}) {
  const cooldownStartedAt = new Date(
    Date.now() - (params.cooldownHours ?? 24) * 60 * 60 * 1000
  );
  const recent = await prisma.notification.findFirst({
    where: {
      userId: params.userId,
      type: params.type,
      createdAt: {
        gte: cooldownStartedAt,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      isRead: true,
    },
  });

  if (recent) {
    if (!recent.isRead) {
      await prisma.notification.update({
        where: { id: recent.id },
        data: {
          title: params.title,
          message: params.message,
        },
      });
    }
    return;
  }

  await prisma.notification.updateMany({
    where: {
      userId: params.userId,
      type: params.type,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
    },
  });
}

async function markUnreadNotificationsRead(
  userId: string,
  types: NotificationType[]
) {
  if (types.length === 0) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      userId,
      type: {
        in: types,
      },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export async function syncNotificationsForUser(userId: string) {
  const account = await getAccountSnapshot(userId);

  if (!account) {
    return;
  }

  const now = new Date();
  const lastActivityAt = await resolveUserLastActivityAt(userId);
  const availableReviewCount = await prisma.reviewQueueItem.count({
    where: {
      userId,
      resolvedAt: null,
      availableAt: {
        lte: now,
      },
    },
  });

  if (!account.preferences.studyReminderEnabled) {
    await markUnreadNotificationsRead(userId, [NotificationType.STUDY_REMINDER]);
  } else {
    const studyReminderNeeded =
      !lastActivityAt ||
      now.getTime() - lastActivityAt.getTime() >= 24 * 60 * 60 * 1000;

    if (studyReminderNeeded) {
      await ensureSingleUnreadNotification({
        userId,
        type: NotificationType.STUDY_REMINDER,
        title: "学習が止まっています",
        message:
          !lastActivityAt
            ? `最初の 1 本を始めると進捗が動き出します。今日の目安 ${account.dailyMinutesGoal} 分だけ進めましょう。`
            : `前回の学習から 24 時間以上空いています。今日の目安 ${account.dailyMinutesGoal} 分ぶんだけ再開しましょう。`,
        cooldownHours: 24,
      });
    } else {
      await markUnreadNotificationsRead(userId, [NotificationType.STUDY_REMINDER]);
    }
  }

  if (!account.preferences.reviewReminderEnabled) {
    await markUnreadNotificationsRead(userId, [NotificationType.REVIEW_REMINDER]);
  } else if (availableReviewCount > 0) {
    await ensureSingleUnreadNotification({
      userId,
      type: NotificationType.REVIEW_REMINDER,
      title: "復習待ちがあります",
      message: `今すぐ取り組める復習が ${availableReviewCount} 件あります。優先度の高いものから戻りましょう。`,
      cooldownHours: 6,
    });
  } else {
    await markUnreadNotificationsRead(userId, [NotificationType.REVIEW_REMINDER]);
  }

  if (!account.preferences.newContentNotificationEnabled) {
    await markUnreadNotificationsRead(userId, [NotificationType.NEW_LESSON]);
  }

  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: {
        select: {
          name: true,
          description: true,
        },
      },
    },
    orderBy: { earnedAt: "desc" },
    take: 5,
  });

  for (const achievement of achievements) {
    const title = `実績を獲得しました: ${achievement.achievement.name}`;
    const message =
      achievement.achievement.description || "プロフィールから確認できます。";
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.ACHIEVEMENT,
        title,
        message,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          type: NotificationType.ACHIEVEMENT,
          title,
          message,
        },
      });
    }
  }
}

export async function createNewLessonNotifications(params: {
  lessonTitle: string;
  trackName: string;
}) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      profile: {
        select: {
          preferencesJson: true,
        },
      },
    },
  });

  const title = "新しいレッスンを公開しました";
  const message = `${params.trackName} に「${params.lessonTitle}」を追加しました。`;

  for (const user of users) {
    const preferences = parseAccountPreferences(user.profile?.preferencesJson);

    if (!preferences.newContentNotificationEnabled) {
      continue;
    }

    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: NotificationType.NEW_LESSON,
        title,
        message,
      },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.NEW_LESSON,
        title,
        message,
      },
    });
  }
}

export async function getNotificationsForUser(userId: string) {
  await syncNotificationsForUser(userId);

  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  });

  const items = rows.map(mapNotification);

  return {
    generatedAt: new Date().toISOString(),
    unreadCount: items.filter((item) => !item.isRead).length,
    items,
  };
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
) {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count === 1;
}

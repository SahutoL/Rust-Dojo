import type { NotificationTypeCode } from "@/data/notifications";

export const notificationTypeLabel: Record<NotificationTypeCode, string> = {
  STUDY_REMINDER: "学習リマインド",
  REVIEW_REMINDER: "復習通知",
  NEW_LESSON: "新規レッスン",
  MOCK_EXAM: "模試通知",
  ACHIEVEMENT: "達成通知",
};

export const notificationTypeVariant: Record<
  NotificationTypeCode,
  "brand" | "warning" | "info" | "success"
> = {
  STUDY_REMINDER: "warning",
  REVIEW_REMINDER: "warning",
  NEW_LESSON: "brand",
  MOCK_EXAM: "info",
  ACHIEVEMENT: "success",
};

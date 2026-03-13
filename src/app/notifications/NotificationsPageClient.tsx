"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import {
  type NotificationSnapshot,
} from "@/data/notifications";
import {
  notificationTypeLabel,
  notificationTypeVariant,
} from "@/lib/notification-meta";

type NotificationFilter = "all" | "unread" | "read";

const filterLabel: Record<NotificationFilter, string> = {
  all: "すべて",
  unread: "未読",
  read: "既読",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

interface NotificationsPageClientProps {
  generatedAt: string;
  initialItems: NotificationSnapshot[];
  initialUnreadCount: number;
}

export function NotificationsPageClient({
  generatedAt,
  initialItems,
  initialUnreadCount,
}: NotificationsPageClientProps) {
  const [items, setItems] = useState(initialItems);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(
    null
  );

  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items]
  );
  const readCount = items.length - unreadCount;
  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return items.filter((item) => !item.isRead);
      case "read":
        return items.filter((item) => item.isRead);
      case "all":
      default:
        return items;
    }
  }, [activeFilter, items]);

  const hasUnread = unreadCount > 0;

  function handleMarkAsRead(notificationId: string) {
    const target = items.find((item) => item.id === notificationId);

    if (!target || target.isRead) {
      return;
    }

    setPendingNotificationId(notificationId);
    void fetch(`/api/notifications/${notificationId}/read`, {
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("NOTIFICATION_READ_FAILED");
        }

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === notificationId ? { ...item, isRead: true } : item
          )
        );
      })
      .catch((error) => {
        console.error("Notification read error:", error);
      })
      .finally(() => {
        setPendingNotificationId((currentId) =>
          currentId === notificationId ? null : currentId
        );
      });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">通知</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            学習再開の目安、復習待ち、新規レッスン、達成通知をまとめて確認できます。
          </p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          生成日時: {formatDateTime(generatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">総件数</p>
          <p className="text-2xl font-semibold">{items.length}</p>
        </Card>
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">未読</p>
          <p className="text-2xl font-semibold">{unreadCount}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            初回読込時 {initialUnreadCount} 件
          </p>
        </Card>
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">既読</p>
          <p className="text-2xl font-semibold">{readCount}</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(Object.keys(filterLabel) as NotificationFilter[]).map((filterKey) => {
          const isActive = activeFilter === filterKey;

          return (
            <button
              type="button"
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              className={[
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-900)] text-[var(--color-brand-200)]"
                  : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              {filterLabel[filterKey]}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 && (
          <Card variant="bordered" padding="lg">
            <h2 className="text-lg font-semibold mb-2">表示できる通知はありません</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              いまの条件では通知は空です。通知設定は設定ページから変更できます。
            </p>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                設定を開く
              </Button>
            </Link>
          </Card>
        )}

        {filteredItems.map((item) => {
          const isMarking = pendingNotificationId === item.id;

          return (
            <Card
              key={item.id}
              variant="bordered"
              padding="lg"
              className={item.isRead ? "opacity-80" : ""}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant={notificationTypeVariant[item.type]} size="sm">
                      {notificationTypeLabel[item.type]}
                    </Badge>
                    {!item.isRead && (
                      <Badge variant="brand" size="sm">
                        未読
                      </Badge>
                    )}
                    {item.isRead && (
                      <Badge variant="default" size="sm">
                        既読
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    {item.message}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={item.actionHref}>
                    <Button variant="ghost" size="sm">
                      開く
                    </Button>
                  </Link>
                  {!item.isRead && (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={isMarking}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      既読にする
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {hasUnread && (
        <p className="text-xs text-[var(--text-tertiary)] mt-6">
          未読の通知は、開いたあとに「既読にする」で整理できます。
        </p>
      )}
    </div>
  );
}

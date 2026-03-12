export const THEME_COOKIE_NAME = "rust-dojo-theme";
export const EDITOR_FONT_SIZE_COOKIE_NAME = "rust-dojo-editor-font-size";

export type ThemePreference = "dark" | "light";
export type EditorFontSizePreference = 14 | 16 | 18;

export interface AccountPreferences {
  theme: ThemePreference;
  editorFontSize: EditorFontSizePreference;
  studyReminderEnabled: boolean;
  reviewReminderEnabled: boolean;
  newContentNotificationEnabled: boolean;
  usageAnalyticsEnabled: boolean;
}

export const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  theme: "dark",
  editorFontSize: 14,
  studyReminderEnabled: true,
  reviewReminderEnabled: true,
  newContentNotificationEnabled: true,
  usageAnalyticsEnabled: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" ? "light" : "dark";
}

export function parseEditorFontSize(value: unknown): EditorFontSizePreference {
  if (value === 16 || value === "16") return 16;
  if (value === 18 || value === "18") return 18;
  return 14;
}

function parseBooleanPreference(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function parseAccountPreferences(value: unknown): AccountPreferences {
  if (!isRecord(value)) {
    return DEFAULT_ACCOUNT_PREFERENCES;
  }

  return {
    theme: parseThemePreference(value.theme),
    editorFontSize: parseEditorFontSize(value.editorFontSize),
    studyReminderEnabled: parseBooleanPreference(
      value.studyReminderEnabled,
      DEFAULT_ACCOUNT_PREFERENCES.studyReminderEnabled
    ),
    reviewReminderEnabled: parseBooleanPreference(
      value.reviewReminderEnabled,
      DEFAULT_ACCOUNT_PREFERENCES.reviewReminderEnabled
    ),
    newContentNotificationEnabled: parseBooleanPreference(
      value.newContentNotificationEnabled,
      DEFAULT_ACCOUNT_PREFERENCES.newContentNotificationEnabled
    ),
    usageAnalyticsEnabled: parseBooleanPreference(
      value.usageAnalyticsEnabled,
      DEFAULT_ACCOUNT_PREFERENCES.usageAnalyticsEnabled
    ),
  };
}

export function serializeAccountPreferences(
  preferences: AccountPreferences
): Record<string, unknown> {
  return {
    theme: preferences.theme,
    editorFontSize: preferences.editorFontSize,
    studyReminderEnabled: preferences.studyReminderEnabled,
    reviewReminderEnabled: preferences.reviewReminderEnabled,
    newContentNotificationEnabled: preferences.newContentNotificationEnabled,
    usageAnalyticsEnabled: preferences.usageAnalyticsEnabled,
  };
}

export function readCookieValue(cookieHeader: string, name: string) {
  const pattern = new RegExp(`(?:^|; )${name}=([^;]*)`);
  const match = cookieHeader.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

export function readThemeFromCookieHeader(cookieHeader: string): ThemePreference {
  return parseThemePreference(readCookieValue(cookieHeader, THEME_COOKIE_NAME));
}

export function readEditorFontSizeFromCookieHeader(
  cookieHeader: string
): EditorFontSizePreference {
  return parseEditorFontSize(
    readCookieValue(cookieHeader, EDITOR_FONT_SIZE_COOKIE_NAME)
  );
}

export function getThemeInitializationScript() {
  return `
    (() => {
      const match = document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]+)/);
      const theme = match ? decodeURIComponent(match[1]) : "dark";
      document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
    })();
  `;
}

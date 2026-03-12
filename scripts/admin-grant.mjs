import "dotenv/config";
import { randomUUID } from "node:crypto";
import process from "node:process";
import pg from "pg";

const VALID_ROLES = new Set(["ADMIN", "EDITOR"]);

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function normalizeConnectionString() {
  const direct = process.env.DIRECT_DATABASE_URL;
  const fallback = process.env.DATABASE_URL;
  const connectionString = direct || fallback;

  if (!connectionString) {
    exitWithError(
      "DIRECT_DATABASE_URL または DATABASE_URL が設定されていません。"
    );
  }

  if (
    !connectionString.startsWith("postgres://") &&
    !connectionString.startsWith("postgresql://")
  ) {
    exitWithError(
      "管理者付与 CLI では TCP 接続の PostgreSQL URL が必要です。DIRECT_DATABASE_URL を設定してください。"
    );
  }

  return connectionString;
}

const [, , emailArg, roleArg] = process.argv;

if (!emailArg) {
  exitWithError(
    "使い方: npm run admin:grant -- <email> [ADMIN|EDITOR]"
  );
}

const email = emailArg.trim().toLowerCase();
const role = (roleArg ?? "EDITOR").trim().toUpperCase();

if (!VALID_ROLES.has(role)) {
  exitWithError("role は ADMIN または EDITOR のみ指定できます。");
}

const pool = new pg.Pool({
  connectionString: normalizeConnectionString(),
});

try {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT id, email FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (userResult.rowCount !== 1) {
      throw new Error(
        `対象ユーザーが見つかりません: ${email}`
      );
    }

    const user = userResult.rows[0];
    const adminId = randomUUID();
    const adminResult = await client.query(
      `INSERT INTO admin_users (id, user_id, role)
       VALUES ($1, $2, $3::"AdminRole")
       ON CONFLICT (user_id)
       DO UPDATE SET role = EXCLUDED.role
       RETURNING role`,
      [adminId, user.id, role]
    );

    await client.query("COMMIT");
    console.log(
      `${user.email} に ${adminResult.rows[0].role} 権限を付与しました。`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  exitWithError(
    error instanceof Error
      ? error.message
      : "管理者付与中に不明なエラーが発生しました。"
  );
} finally {
  await pool.end();
}

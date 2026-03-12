# Rust Dojo

Rust Dojo は、日本語で Rust を学べるハンズオン学習プラットフォームです。プログラミング未経験者向けの前提知識から、Rust の基本文法、ブラウザ上での実装演習、AtCoder 向けの初期教材までを一つの導線で提供します。

現在のリポジトリは、Phase 1 MVP と Phase 2 の初期公開分を含みます。Track 0 / Track 1 は一通り学習可能、Track 2 は準備中、Track 3 は AtCoder Rust の初期セットを公開済みです。

## 公開中の内容

| Track | 内容 | 状態 |
| --- | --- | --- |
| Track 0 | プログラミング前提 | 公開中 |
| Track 1 | Rust 入門 | 公開中 |
| Track 2 | Rust 実務 | 準備中 |
| Track 3 | AtCoder Rust | 初期公開中 |

主な機能は次の通りです。

- 学習トラック一覧、トラック詳細、レッスン詳細
- オンボーディング診断による学習トラック推薦
- Monaco Editor を使ったブラウザ上のコード実行と提出
- Rust Playground API を使った実行・採点フロー
- NextAuth.js によるメールアドレス / パスワード認証
- ダッシュボード、進捗表示、演習一覧

## 技術スタック

- Next.js 16.1.6 / React 19 / TypeScript
- Tailwind CSS v4
- NextAuth.js v5 (Credentials + JWT)
- Prisma 7 + PostgreSQL
- Monaco Editor
- react-markdown + remark-gfm
- Rust Playground API

## ローカルセットアップ

### 前提

- Node.js 20 以降
- npm
- PostgreSQL は `npx prisma dev` で起動

`nvm` を使う場合は、先に以下を読み込んでください。

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

### 1. 依存関係をインストール

```bash
npm install
```

### 2. 環境変数を設定

`.env` に少なくとも以下を設定します。

```bash
DATABASE_URL="prisma+postgres://..."
DIRECT_DATABASE_URL="postgres://..."
AUTH_SECRET="your-secret"
AUTH_URL="http://localhost:3000"
PG_POOL_MAX="8"
PG_POOL_CONNECTION_TIMEOUT_MS="3000"
PG_POOL_IDLE_TIMEOUT_MS="30000"
```

- `DATABASE_URL`: Prisma CLI 用
- `DIRECT_DATABASE_URL`: アプリケーション実行時の接続用
- `AUTH_SECRET`: NextAuth の署名鍵
- `AUTH_URL`: ローカル開発時は `http://localhost:3000`
- `PG_POOL_MAX`: PostgreSQL 接続プール上限。未指定時は development で `8`、production で `12`
- `PG_POOL_CONNECTION_TIMEOUT_MS`: 接続待ちタイムアウト。未指定時は `3000`
- `PG_POOL_IDLE_TIMEOUT_MS`: アイドル接続の保持時間。未指定時は `30000`

### 3. データベースを起動してスキーマを反映

```bash
npx prisma dev --detach
npx prisma migrate deploy
npx prisma generate
npm run content:bootstrap
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと確認できます。

`npm run dev` と `npm run build` は安定性を優先して Webpack を使います。Turbopack の比較検証が必要な場合だけ `npm run dev:turbo` / `npm run build:turbo` を使ってください。

## 開発コマンド

```bash
npm run dev
npm run dev:turbo
npm run build
npm run build:turbo
npm run lint
npm run admin:grant -- admin@example.com ADMIN
npm run content:bootstrap
```

補足:

- `npm run build` では `next/font/google` の取得が発生するため、実行環境によってはネットワーク接続が必要です。
- Prisma Client は `src/generated/prisma` に出力されます。
- 初期教材と初期演習は `src/data/lessons.ts` / `src/data/problems.ts` を fixture として保持し、`npm run content:bootstrap` で DB に投入します。

## ディレクトリ構成

```text
src/app         App Router のページと API ルート
src/components  共通 UI とレイアウト部品
src/data        DB 集計層と fixture
src/lib         認証、Prisma、教材 bootstrap、外部 API クライアント
prisma          Prisma schema と migration
public          静的アセット
updates         完了済み作業ログ
```

## 開発状況

- Track 0: 公開中
- Track 1: 公開中
- Track 2: 準備中
- Track 3: 入出力テンプレート、Vec、ソート、探索、全探索の初期セットを公開中

教材と演習は今後も段階的に拡充予定です。

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

タスク管理カンバンアプリ。`/tasks` にタスクの CRUD（一覧・追加・編集・削除）を持つ3列カンバンがある。`/`（ホーム）は `/tasks` へリダイレクトする（`src/app/page.tsx`、テストは `__tests__/page.test.tsx`）。

## 技術スタック

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Next.js 16.4（App Router、Turbopack） |
| UI | React 19.3 |
| 言語 | TypeScript 5（strict） |
| スタイリング | Tailwind CSS v4（`@tailwindcss/turbopack`） |
| UI コンポーネント | shadcn/ui（`base-nova`、Base UI ベース、アイコンは `lucide-react`） |
| テスト | Vitest 5 / React Testing Library / jsdom |
| Lint | ESLint 9（`eslint-config-next`） |
| バックエンド | Supabase（`@supabase/supabase-js` / `@supabase/ssr`） |

## ディレクトリ構成

```
task-kanban/
├── src/
│   ├── app/              # App Router のルート（layout.tsx / page.tsx / globals.css）
│   │   └── tasks/        # タスク画面（page.tsx / actions.ts / _components/）
│   ├── components/ui/    # shadcn/ui のコンポーネント（`npx shadcn add` で追加される）
│   ├── lib/utils.ts      # `cn()`（クラス名の結合・マージ）
│   ├── lib/supabase/     # Supabase クライアントと接続チェック（database.types.ts は生成物）
│   ├── lib/tasks/        # タスクの型・検証（validation.ts）・取得（queries.ts）
│   └── instrumentation.ts # サーバー起動時の処理（Supabase 接続チェック）
├── __tests__/            # Vitest のテスト
├── components.json       # shadcn/ui の設定
├── .env.example          # 環境変数のキー一覧（値は .env.local に書く）
├── public/               # 静的ファイル
├── next.config.ts        # Next.js 設定（Cache Components / Turbopack ローダー）
├── vitest.config.mts     # Vitest 設定
├── vitest.setup.ts       # テストのセットアップ（cleanup）
├── eslint.config.mjs     # ESLint（flat config）
├── tsconfig.json
├── AGENTS.md             # next dev が自動生成するエージェント向け注意書き
└── CLAUDE.md
```

- パスエイリアス `@/*` → `./src/*`

## コマンド

```bash
npm run dev        # 開発サーバー（http://localhost:3000）
npm run build      # 本番ビルド
npm run lint       # ESLint（flat config: eslint.config.mjs）
npx tsc --noEmit   # 型チェック（専用スクリプトなし）

npm test                                  # Vitest ウォッチモード
npm run test:run                          # 1回だけ実行（CI 向け）
npx vitest run __tests__/page.test.tsx    # 単一ファイル
npx vitest run -t "見出し"                 # テスト名で絞り込み
```

## Next.js 16 固有の注意点

学習データ上の Next.js と挙動・API が異なる。コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読むこと（`AGENTS.md` 参照）。

- **Cache Components が有効**（`next.config.ts` の `cacheComponents: true` + `partialPrefetching: true`）。データ取得はデフォルトで動的で、キャッシュは `"use cache"` / `cacheLife` / `cacheTag` で明示する。ルートセグメント設定の `runtime` export は使えない（Node.js ランタイム必須）。詳細は `docs/01-app/01-getting-started/08-caching.md`、`docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`。
- `LayoutProps<"/">` / `PageProps` などのルート型はグローバルに生成される型ヘルパー（import 不要）。
- `AGENTS.md` は `next dev` が自動で再生成するファイル。手で消しても戻るので、変更があればそのままコミットしてよい。

## Supabase

- プロジェクト: `task-kanban`（ID `yzvqdigszdmkpxmyfzdk`、`ap-northeast-1`）。MCP（`.mcp.json` の `supabase`）で参照・操作できる。
- 環境変数は `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。キーは `.env.example`、実際の値は `.env.local`（Git 管理外）。キーは旧来の anon key ではなく publishable key（`sb_publishable_...`）を使う。
- クライアントは用途で使い分ける。どちらも `createClient()` を export している。
  - `@/lib/supabase/server`：Server Component / Server Action / Route Handler 用（`async`、`next/headers` の `cookies()` を使う）。リクエストごとに作り、グローバルに保持しない。
  - `@/lib/supabase/client`：Client Component（`"use client"`）用。
- `server.ts` の `createClient()` は `createServerClient<Database>`（`database.types.ts`）で型付け済み。`client.ts` は未対応なので、テーブル操作は `server` 側で行う。
- 環境変数は直接読まず、`@/lib/supabase/env` の `getSupabaseEnv()` を使う（未設定なら変数名入りのエラーを投げる）。`process.env[name]` や分割代入のような動的な参照はブラウザ向けにインライン化されないので、`process.env.NEXT_PUBLIC_XXX` と直接書くこと。
- `src/instrumentation.ts` の `register()` がサーバー起動時に `checkSupabaseConnection()`（Auth の `/auth/v1/health` を叩く）を実行し、**失敗時のみ** `console.error` で `[Supabase] 接続に失敗しました: <理由>` を出す。成功時は何も出さない。
- テストでは環境変数を `vi.stubEnv`、`fetch` を `vi.stubGlobal` でモックする（`__tests__/check-connection.test.ts` 参照）。

## タスク機能（`/tasks`）

- テーブル `public.tasks`：`id`(uuid) / `title`(1〜100文字) / `description`(〜1000文字、既定 `''`) / `status`(`todo` | `doing` | `done`、既定 `todo`) / `created_at` / `updated_at`（更新トリガーで自動更新）。制約は DB の CHECK と `lib/tasks/validation.ts` の両方で守る（上限値は後者の定数）。
- RLS は有効。**認証導入前の暫定として anon に SELECT/INSERT/UPDATE/DELETE を全許可**している（マイグレーション `create_tasks_table`）。認証を入れるときはユーザー単位のポリシーに差し替えること。
- スキーマを変えたら Supabase MCP の `apply_migration` で適用し、`generate_typescript_types` の出力で `src/lib/supabase/database.types.ts` を更新する。
- 更新系は Server Action（`src/app/tasks/actions.ts`：`createTask` / `updateTask` / `deleteTask`）。検証 → Supabase 操作 → `revalidatePath("/tasks")` の順で、結果は `ActionResult`（`{ ok: true }` または `{ ok: false, error }`）で返す。`revalidatePath` により、操作結果は Action のレスポンスに同梱された最新の画面で即座に一覧へ反映される。Supabase クライアントは `cookies()` を使うため `"use cache"` / `updateTag` は使えない。
- 型は `lib/tasks/types.ts`（`Task` / `TaskStatus` / `RawTaskInput`（検証前）/ `TaskInput`（検証済み）/ `ActionResult` / `isTaskStatus`）。ステータスの追加・変更は `taskStatuses`、画面の表示名 `_components/status-labels.ts` の `statusLabels`、DB の CHECK の3か所を揃える。
- 検証は `validateTaskInput()`：前後の空白を trim し、文字数はコードポイント単位（DB の `char_length` と同じ）で数える。エラーメッセージは日本語の固定文言で、DB の生エラーは画面に出さない。
- 一覧取得は `getTasks()`（`lib/tasks/queries.ts`）。`page.tsx` は同期コンポーネントで、`<Suspense>` の内側の async コンポーネントがデータを取得する（Cache Components の制約）。
- 画面の Client Component（`TaskBoard` / `TaskForm` / `TaskCard`）は Action を props で受け取る。テストでは Action だけを差し替えればよい。削除前の確認は `window.confirm`（テストは `vi.spyOn(window, "confirm")`）。
- テストは `__tests__/tasks/`（`validation` / `actions` / `task-board`）。`user-event` は未導入のため、操作は `fireEvent` で行う。

## スタイリング

Tailwind v4 は PostCSS ではなく Turbopack のローダー（`next.config.ts` の `turbopack.rules` で `*.css` に `@tailwindcss/turbopack`）で処理している。`postcss.config` や `tailwind.config` は存在しない。テーマトークンは `src/app/globals.css` に定義している（`@theme inline` で CSS 変数を Tailwind のトークンに対応付け、値は `:root` / `.dark` に置く）。ダークモードは `prefers-color-scheme` ではなく `.dark` クラス（`@custom-variant dark`）で切り替える仕組みで、現時点では `.dark` を付ける処理は入れていない。

## shadcn/ui

- 設定は `components.json`（style `base-nova`、baseColor `neutral`、CSS 変数あり、Tailwind config は空）。エイリアスは `@/components` / `@/components/ui` / `@/lib/utils` / `@/hooks`。
- コンポーネントの追加は `npx shadcn@latest add <name>`（例：`button`）。ソースが `src/components/ui/` にコピーされるので、必要なら直接編集してよい。追加前に `--dry-run` / `--diff` で差分を確認できる。
- `cn()` は `src/lib/utils.ts` が `cn` パッケージから再エクスポートしている（`clsx` + `tailwind-merge` ではない）。クラス名の結合は `@/lib/utils` の `cn` を使う。
- `shadcn init` は `globals.css` を書き換える。再実行するとテーマが上書きされるので注意。
- 導入済みのコンポーネント：`button` / `card` / `input` / `textarea` / `label` / `badge` / `skeleton` / `alert` / `native-select`。タスク画面（`TaskBoard` / `TaskForm` / `TaskCard`）はこれらで構成している。ステータス選択はテストが `fireEvent.change` で操作するため、Base UI の Select ではなくネイティブの `NativeSelect` を使う。
- 使い方・最新仕様は Context7 MCP で確認する（`/shadcn-ui/ui`）。

## デザインルール

- **部品は shadcn/ui を使う**：ボタン・入力・カード・バッジ・アラート等は素の HTML + Tailwind で書かず `@/components/ui/` のコンポーネントを使う。足りなければ `npx shadcn@latest add <name>` で追加する。
- **色はテーマトークンで指定する**：`bg-muted` / `text-muted-foreground` / `text-destructive` / `border-input` など。`text-red-600` のような固定色や `bg-foreground/5` のような場当たり的な透過は使わない。例外は列のアクセント色（`task-board.tsx` の `columnAccents`：未着手=slate、進行中=blue、完了=emerald）のみ。
- **アイコンは `lucide-react`**。アイコンだけのボタンは `size="icon-sm"` の `Button` + `aria-label` を付ける（ラベルはテストからも参照される）。
- **エラー表示は `Alert variant="destructive"`**（`role="alert"` が付く）。
- **フォーム**：`Label`（`htmlFor` + `useId`）+ `Input` / `Textarea` / `NativeSelect` を `Card` で包み、操作ボタンは `CardFooter` に右寄せで置く（キャンセル=`outline`、保存=既定）。ステータス選択は `fireEvent.change` で操作するテストがあるため、Base UI の Select は使わずネイティブの `NativeSelect` を使う。フォームは Dialog にせずインライン表示にする。
- **レイアウト**：ページは幅の上限を設けず画面全体を使う（`main` は `px-4 sm:px-8 lg:px-12`、背景 `bg-muted/30`）。カンバンの3列は `flex` で**常に横並び**（`flex-1 basis-0 min-w-72`）にし、狭い画面では縦に積まず横スクロールにする。列は `min-h-[60vh]` で縦に伸ばす。
- **カード・列**：角丸は `rounded-xl`。タスクカードは `Card size="sm"`（`shadow-sm`、hover で `shadow-md`）。列ヘッダーは「色ドット + 見出し + 件数 `Badge`」、空の列は破線ボーダーのプレースホルダ。
- **読み込み中は `Skeleton`** で本番と同じ3列構成のプレースホルダを出す。
- **ダークモード**：`.dark` クラス方式で未対応のため、トークンを使っておけば将来そのまま切り替えられる状態を保つ。
- デザインを変えたら `npm test` に加え、Playwright MCP でデスクトップ（1280px 以上）と狭幅（390px）の表示、追加・編集・削除（`browser_handle_dialog` で confirm を承認/拒否）の動作を確認する。確認用に作ったタスクは削除して DB を元に戻す。

## テスト

- Vitest 5 + React Testing Library + jsdom。設定は `vitest.config.mts`（tsconfig のパス解決は Vite 組み込みの `resolve.tsconfigPaths: true` を使用。`vite-tsconfig-paths` プラグインは不要）。
- `globals` は無効。`describe` / `test` / `expect` は `vitest` から明示的に import する。DOM のクリーンアップは `vitest.setup.ts` の `afterEach(cleanup)` で行っている。
- テストは `__tests__/` に置いている（`src/app` 内への同居も可）。
- `async` な Server Component は Vitest で単体テストできない。それらは E2E でテストする（E2E 環境は未導入）。


## コーディングルール
- 変更後は必ず`npm test`でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名、関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール
- 網羅性：正常系・異常系・境界値を検討してください
- 可読性：テスト名に条件と期待する結果を明示してください
- 保守性：実装の内部構造ではなく、ユーザーから見た振る舞いをテストしてください
- 独立性：テスト間で状態を共有しないでください
- 状態遷移：画面遷移の順方向・逆方向を検証してください
- モック方針：外部依存のみモック可としてください

## 禁止事項
- console.logに本番コードを残さないでください
- 既存のテストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- Next.js・Supabase・Vitestなどの最新仕様はContext7 MCPを使って公式ドキュメントを確認してください

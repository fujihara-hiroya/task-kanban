# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

タスク管理カンバンアプリ。現状は `create-next-app` の雛形に Vitest を追加しただけの段階。

## 技術スタック

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Next.js 16.4（App Router、Turbopack） |
| UI | React 19.3 |
| 言語 | TypeScript 5（strict） |
| スタイリング | Tailwind CSS v4（`@tailwindcss/turbopack`） |
| テスト | Vitest 5 / React Testing Library / jsdom |
| Lint | ESLint 9（`eslint-config-next`） |

## ディレクトリ構成

```
task-kanban/
├── src/
│   └── app/              # App Router のルート（layout.tsx / page.tsx / globals.css）
├── __tests__/            # Vitest のテスト
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

## スタイリング

Tailwind v4 は PostCSS ではなく Turbopack のローダー（`next.config.ts` の `turbopack.rules` で `*.css` に `@tailwindcss/turbopack`）で処理している。`postcss.config` や `tailwind.config` は存在しない。テーマトークンは `src/app/globals.css` の `@theme inline` で CSS 変数（`--background` / `--foreground`、ダークモードは `prefers-color-scheme`）から定義している。

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

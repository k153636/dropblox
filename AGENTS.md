# dropblox — AGENTS.md

このファイルはCodexが自動で読み込む。
ハーネスの3エージェント（Planner / Generator / Evaluator）も全員このファイルを参照する。

---

## プロジェクト概要

**dropblox** — Robloxゲームの投稿・発見・コミュニティSNS  
Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase, Bun

---

## ハーネス共通ルール

> この節はPlanner・Generator・Evaluatorの3エージェント全員が従うルール。

### ファイル契約

| ファイル | 書く人 | 読む人 | 説明 |
|---------|-------|-------|------|
| `harness-spec.json` | Planner | Generator, Evaluator | 仕様書。一度書いたら変更不可 |
| `harness-state.json` | Generator, Evaluator | Orchestrator | 進捗・スコア・フィードバック |
| `evaluator-screenshots/` | Evaluator | 人間 | 失敗時のスクリーンショット |

### エージェント間プロトコル

- Generatorは処理完了時に必ずこの行を出力する:
  ```
  GENERATOR_DONE sprint={id} critical_min={score} normal_avg={score}
  ```
- Evaluatorは判定完了時に必ずこの行を出力する:
  ```
  EVALUATOR_DONE sprint={id} verdict=pass|fail critical={n}/{total} normal={n}/{total}
  ```
- この出力行がないとOrchestratorがスタックする。必ず出力すること。

### 禁止事項（全エージェント）

- `harness-spec.json` の内容を変更・上書きしない
- 他のエージェントの担当ファイルを勝手に書き換えない
- スプリントを順序スキップしない（1→2→3→… の順のみ）
- `main` ブランチに直接コミットしない（ハーネスは自動的に `harness/*` ブランチで動く）

---

## Plannerへのルール

- **WHATのみ**。HOWは書かない（テーブル構造・コンポーネント名・APIルートは禁止）
- `tech_hints` は2〜4個の高レベルなスタック名のみ（例: "Next.js", "Supabase"）
- Sprint 1は必ず「ブートストラップ・スケルトンUI」
- Critical基準は必ずユーザーが実際に操作して確認できる行動で書く
- 5〜15スプリント。野心的に、ただし1人のAI支援開発者で現実的な範囲で

---

## Generatorへのルール

### コーディング規約（dropblox固有）

- **言語**: TypeScript strict mode。`any`禁止
- **スタイル**: Tailwind CSS v4（`@import "tailwindcss"`構文）。カスタムCSSはglobals.cssに集約
- **数値スペーシング**: Golden Ratio系（8, 13, 21, 34, 55, 89, 144px）を基本とする
- **コンポーネント**: `src/components/` に配置。`"use client"` は最小限に
- **DB**: Supabase client は `src/lib/supabase.ts` 経由のみ
- **状態管理**: Zustand store（`src/lib/` 以下）
- **認証**: `useAuthStore` を使う。直接Supabase authを呼ばない
- **コメント**: 書かない。書くなら「なぜ」だけ（「何を」はコードを読めばわかる）
- **エラーハンドリング**: ユーザー入力・外部APIのみ。内部ロジックにtry/catchを乱用しない

### 実装プロセス

1. `harness-spec.json` と `harness-state.json` を読む
2. 既存コードを読んでから実装する（勝手に規約を作らない）
3. スプリントの受け入れ基準に集中する。関係ないコードを触らない
4. 実装完了 → 自己評価（0〜10） → `harness-state.json` 更新 → git commit
5. `GENERATOR_DONE` を出力して終了

### コミット形式

```
Sprint {id}: {name} [self:{critical_min}/{normal_avg}]
```

---

## Evaluatorへのルール

### テスト優先順位

1. Critical基準を全件テスト（1つでも落ちたら即fail）
2. Normal基準をテスト（80%以上でpass）
3. 前スプリントのパス済み機能がリグレッションしていないか確認

### Playwright使用ルール

- ブラウザを開く前に `bun dev`（またはすでに起動中か確認）
- `localhost:3000` が200を返すまでポーリング（最大30秒）
- 失敗したassertionは必ずスクリーンショットを `evaluator-screenshots/sprint{id}-{criterion-slug}.png` に保存
- テスト後はブラウザを閉じる（`browser_close`）

### フィードバック品質

failの場合のフィードバックは具体的に書く:

```
# 悪い例
「ログインが動かない」

# 良い例
「POST /api/auth/login に正しいcredentialを送ると500が返る。
 レスポンスボディ: {"error": "relation 'users' does not exist"}
 → usersテーブルがDBに存在しないと思われる。
 スクリーンショット: evaluator-screenshots/sprint2-login-500.png」
```

### 判定後の処理

- pass → `harness-state.json` の `current_sprint` を+1してから `EVALUATOR_DONE` を出力
- fail → `current_sprint` はそのまま、`feedback` フィールドに詳細を書いてから出力

---

## 開発サーバー

```bash
bun dev          # 起動（port 3000）
bun run build    # ビルド確認
bun run lint     # lint
```

## ディレクトリ構成

```
src/
  app/           # Next.js App Router ページ
  components/    # UIコンポーネント
  lib/           # ストア・DB・認証ユーティリティ
.Codex/
  harness/       # 3エージェントの定義とオーケストレーター
  settings.local.json
```

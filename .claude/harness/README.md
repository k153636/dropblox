# Dev Harness

Planner → Generator → Evaluator の3エージェントパイプライン。

## セットアップ

```bash
# プロジェクトディレクトリで実行
cd /path/to/new-project

# Evaluator で Playwright MCP を使う場合（任意）
claude mcp add playwright -- npx @playwright/mcp@latest
```

## 使い方

### 1. 仕様書を生成（Planner）

```bash
bun ~/.claude/harness/orchestrate.ts plan "2Dレトロゲームメーカーを作って。スプライトエディタ、レベルエディタ、エクスポート機能付き"
```

→ `harness-spec.json` が生成される

### 2. スプリントを実行（Generator + Evaluator）

```bash
# 現在のスプリントを1回実行
bun ~/.claude/harness/orchestrate.ts run

# 全スプリントを自律的に実行
bun ~/.claude/harness/orchestrate.ts run --all
```

### 3. 進捗確認

```bash
bun ~/.claude/harness/orchestrate.ts status
```

```
ID  Name                           Status       Retries
────────────────────────────────────────────────────────
1   Bootstrap & skeleton UI        ✅ pass       1
2   Sprite editor                  ✅ pass       2
3   Level editor                   🔄 self_ev…  1   ◀
4   Animation system               ⬜ pending    0
```

## エージェント設計

### Planner
- **入力**: 1〜4行のブリーフ
- **出力**: `harness-spec.json`（スプリント構造・受け入れ基準付き）
- **制約**: 「何を作るか」のみ。実装詳細なし

### Generator
- **入力**: spec + state（現スプリント番号）
- **出力**: 実装コード + `git commit` + 自己評価スコア
- **プロセス**: 1スプリント1コミット

### Evaluator
- **入力**: spec（受け入れ基準）+ 実行中のアプリ
- **出力**: 合否 + 詳細フィードバック
- **閾値**: Critical 100% + Normal 80% でパス
- **ツール**: Playwright MCP（設定済みの場合）

## 合否ロジック

```
Sprint passes if:
  ALL critical criteria pass
  AND ≥80% of normal criteria pass

On fail:
  Evaluator writes specific feedback
  Generator retries with feedback (max 3 retries)
  If still failing → halt, manual intervention needed
```

## ファイル構成

```
harness-spec.json     ← Planner が生成
harness-state.json    ← 実行状態・スコア・フィードバック
evaluator-screenshots/  ← 失敗時のスクリーンショット
```

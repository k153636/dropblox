# dropblox — CLAUDE.md

このファイルはClaude Codeが自動で読み込む。
ハーネスの3エージェント（Planner / Generator / Evaluator）も全員このファイルを参照する。

---

## プロジェクト概要

**dropblox** — Robloxゲームの投稿・発見・コミュニティSNS  
Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase, Bun

**本番URL**: Vercelにデプロイ済み（GitHubのリポジトリヘッダーのリンクを参照）

---

## 自律開発の優先原則

このプロジェクトを最高品質に仕上げるために自律的に動く場合、以下の優先順位で判断する。

1. **既存UIを壊さない** — 動いているものを崩すコストは実装コストより常に高い
2. **ユーザーが実際に使う機能** — 視覚的微調整より機能の有無の方が価値が高い
3. **モバイルファースト** — ユーザーの多くはスマートフォンからアクセスする
4. **パフォーマンス** — N+1クエリ・不要なリレンダリングを避ける
5. **コミットは細かく、プッシュも頻繁に** — 区切りごとに必ずプッシュする

---

## デザインシステム（厳守）

### カラー

| 用途 | 値 |
|-----|---|
| ブランドカラー | `emerald-400`（テキスト）/ `emerald-500`（ボタン）|
| 背景 | `zinc-950` |
| ガラス背景 | `bg-zinc-950/55`〜`bg-zinc-950/85`（透明度はコンテキストで調整）|
| テキスト主 | `zinc-100` |
| テキスト副 | `zinc-300`〜`zinc-400` |
| テキスト補 | `zinc-500`〜`zinc-600` |
| ボーダー | `rgba(255,255,255,0.05〜0.08)` — `box-shadow: 0 0 0 1px` で表現 |

### スペーシング（Golden Ratio系 — この値以外を使わない）

`8px / 13px / 21px / 34px / 55px / 89px / 144px`

### ガラスモーフィズムのレシピ

```
bg-zinc-950/{opacity}
backdrop-blur-2xl
shadow-[0_0_0_1px_rgba(255,255,255,0.07)]        ← ボーダー代わり
shadow-[0_{size}px_{blur}px_rgba(0,0,0,{opacity})]  ← 浮遊感
```

**重要**: `border` プロパティは使わず、`box-shadow` でボーダーを表現する。
`backdrop-blur` が機能するには背景が半透明である必要がある。

### Z-index 階層

| 要素 | z-index |
|-----|---------|
| Header | 50 |
| Sidebar backdrop | 59 |
| Sidebar | 60 |
| Sidebar Xボタン | 61 |
| MobileNav | 50 |
| モーダル backdrop | 60 |
| モーダル | 61 |
| AuthModal | 100 |
| フルスクリーン | 70 |

### Sidebar 寸法

- `left: 13px` / `top: 55px`（Header高さ）/ `bottom: 13px`
- 閉: `w-[89px]` / 開: `w-[144px]`
- モバイル非表示: `-translate-x-[calc(100%+14px)]`
- 上部に逆角丸（Inverted corners）: 13×13pxのガラスdivが左右に張り出す

### ホバー = active のペア原則

**全てのインタラクティブ要素に `hover:X` があれば必ず `active:X` も追加する。**
モバイルで `hover:` は発火しない。`active:` がモバイルのタップフィードバックになる。
（`IOSTouchFix` コンポーネントが body に touchstart を登録してiOS activeを有効化）

---

## 実装済み機能

### コア機能
- 投稿 CRUD（作成・読み取り・更新・削除）
- いいね（DBトリガーで `posts.likes` カウンターを自動維持）
- コメント（ネスト5階層・いいね付き）
- GitHub / Roblox OAuth 認証
- Roblox URL からゲーム情報を自動取得（API経由）
- スクリーンショットカルーセル（詳細モーダル）

### フィード・検索
- 無限スクロール（仮想化・DOM最大50件）
- ジャンルフィルター（SQLの `GROUP BY` で取得）
- ソート（最新 / 人気）
- 全文検索（`search_posts` RPC + ILIKE フォールバック）

### プロフィール
- 投稿グリッド・いいねグリッド
- フォロー（DBテーブルのみ・UI未実装）
- 著者アバター → 投稿カードに表示
- プロフィール変更時に全投稿の `author_name` / `author_avatar_url` を自動同期（DBトリガー）

### UI・UX
- Glassmorphism ダークテーマ
- モバイル: MobileNav（フローティングピル）+ Sidebarスワイプ
- PC: Sidebar（開閉アニメーション 89px→144px）
- レスポンシブ（md: ブレークポイント = 768px）
- iOS `active:` 状態対応（IOSTouchFix）
- Realtime（Supabase Realtime でフィード自動更新）

---

## DBスキーマ現状（migrations 0001〜0011）

### テーブル

**profiles**: `id, username, avatar_url, bio, created_at`

**posts**: `id, url, body, preview_name, preview_description, preview_thumbnail, preview_playing, preview_visits, preview_genre, last_fetched_at, author_id, author_name, author_avatar_url, likes, created_at`

**comments**: `id, post_id, author_id, author_name, body, parent_id, likes, created_at`

**likes**: `id, post_id, user_id, created_at` (UNIQUE: post_id+user_id)

**comment_likes**: `id, comment_id, user_id, created_at`

**follows**: `id, follower_id, following_id, created_at` (UNIQUE: follower_id+following_id)

### DBトリガー・関数

- `update_post_likes_count()`: likes INSERT/DELETE → `posts.likes` を自動更新
- `get_distinct_genres(limit_n int)`: ジャンル一覧をGROUP BYで取得するRPC
- `sync_author_info_to_posts()`: profiles UPDATE → 全投稿の author_name / author_avatar_url を同期

### Supabase CLIでマイグレーションを適用する方法

```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked --workdir /tmp -f "<絶対パス>.sql"
```

`.env.local` に日本語コメントがあるため `--workdir /tmp` が必須。

---

## 未実装・優先度高（この順で実装すると価値が高い）

### 1. フォローしている人のタイムライン（高）
- `follows` テーブルはある
- フィードを「全体」と「フォロー中」に切り替えるトグル
- `getPosts` に `following_ids` フィルターを追加するだけ

### 2. 通知（高）
- いいね・コメント・フォローを `notifications` テーブルに記録
- ヘッダーにバッジ表示
- リテンションに直結

### 3. 個別ゲームページ `/game/[id]`（中）
- SEO・シェアability
- 現在は DetailModal のみでURLなし
- OGPメタタグも追加

### 4. ユーザー発見 `/users`（中）
- フォロワー数順・新規登録順のユーザーリスト
- フォローボタン付き

### 5. Robloxアバター表示（低）
- Roblox API から thumbnail 取得
- コメント欄・プロフィールに表示

---

## やらない・やるべきでない判断

- **Squircle（figma-squircle）の全面導入**: box-shadow依存のガラスUIと根本的に相性が悪い。アバターのみ適用は検討余地あり。
- **CSS `corner-shape: squircle`**: ブラウザサポートなし。本番非推奨。
- **Edge Functions**: Vercel推奨のFluid Computeを使う。
- **大規模UIリファクタ**: ユーザー数が少ない段階ではROIが低い。機能追加を優先。

---

## コーディング規約（dropblox固有）

- **言語**: TypeScript strict mode。`any` 禁止
- **スタイル**: Tailwind CSS v4（`@import "tailwindcss"` 構文）
- **スペーシング**: 8/13/21/34/55/89/144px のみ
- **コンポーネント**: `src/components/` に配置。`"use client"` は最小限に
- **DB**: Supabase client は `src/lib/supabase.ts` 経由のみ
- **状態管理**: Zustand store（`src/lib/store.ts` と `src/lib/auth-store.ts`）
- **認証**: `useAuthStore` を使う。直接Supabase authを呼ばない
- **コメント**: 書かない。書くなら「なぜ」だけ
- **エラーハンドリング**: ユーザー入力・外部APIのみ

---

## コミットルール（必須）

**全コミットに必ず Co-Authored-By トレーラーを付ける:**

```bash
git commit -m "$(cat <<'EOF'
feat: 機能の説明

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

コミットは区切りごとに細かく作り、毎回 `git push origin main` する。

---

## 開発サーバー

```bash
bun dev          # 起動（port 3000）
bun run build    # ビルド確認
bun run lint     # lint
```

---

## ディレクトリ構成

```
src/
  app/
    api/           # API Routes（Roblox fetch, auth, chat等）
    auth/          # OAuth callback
    profile/       # プロフィールページ
    search/        # 検索ページ
    page.tsx       # メインフィード
    layout.tsx     # ルートレイアウト
  components/
    Feed.tsx           # メインフィード（仮想化・無限スクロール）
    PostCard.tsx        # 投稿カード（コメント・いいね含む）
    PostDetailModal.tsx # 詳細モーダル（スクリーンショットカルーセル）
    PostModal.tsx       # 投稿作成モーダル
    Sidebar.tsx         # PCサイドバー（開閉・タッチジェスチャー）
    MobileNav.tsx       # モバイル下部ナビ
    Header.tsx          # トップバー
    SearchBar.tsx       # 検索バー（Sidebar内）
    AuthModal.tsx       # 認証モーダル
    IOSTouchFix.tsx     # iOS active状態有効化
  lib/
    store.ts       # Zustand メインストア（投稿・検索・フィルター）
    auth-store.ts  # 認証ストア
    db-posts.ts    # 投稿DB操作
    db-likes.ts    # いいねDB操作
    db-comments.ts # コメントDB操作
    db-follows.ts  # フォローDB操作
    supabase.ts    # Supabaseクライアント
    openrouter.ts  # AI chat（実験的）
supabase/
  migrations/      # 0001〜0011 の SQLマイグレーション
.claude/
  harness/         # 3エージェント定義とオーケストレーター
```

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

### 禁止事項（全エージェント）

- `harness-spec.json` の内容を変更・上書きしない
- スプリントを順序スキップしない（1→2→3→… の順のみ）
- `main` ブランチに直接コミットしない（ハーネスは自動的に `harness/*` ブランチで動く）

---

## Plannerへのルール

- **WHATのみ**。HOWは書かない
- Sprint 1は必ず「ブートストラップ・スケルトンUI」
- Critical基準は必ずユーザーが実際に操作して確認できる行動で書く
- 5〜15スプリント

---

## Evaluatorへのルール

- Critical基準を全件テスト（1つでも落ちたら即fail）
- `localhost:3000` が200を返すまでポーリング（最大30秒）
- 失敗時はスクリーンショットを `evaluator-screenshots/sprint{id}-{criterion-slug}.png` に保存
- pass → `current_sprint` を+1してから `EVALUATOR_DONE` を出力
- fail → `current_sprint` はそのまま、`feedback` に詳細を書いてから出力

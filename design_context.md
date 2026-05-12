# dropblox — Claude Design 向け指示書

## プロジェクト概要

**dropblox** は Roblox ゲームをシェアするダークテーマのソーシャルフィード。
ユーザーが Roblox ゲームの URL を投稿すると、サムネイル・プレイ数・訪問数を自動取得してカード表示する。

**スタック**: Next.js 16 / React 19 / Tailwind CSS v4 / Supabase  
**フォント**: Inter  
**アイコン**: lucide-react

---

## デザイン方針

- **テーマ**: ダーク一択（`bg-zinc-950` ベース）
- **アクセントカラー**: emerald-500（`#10b981`）のみ
- **スペーシング**: 黄金比ベース（5→8→13→21→34→55→89→144 px）
- **目指す雰囲気**: モダン・ミニマル。余白を活かしたクリーンな見た目

---

## カラーシステム

```
ページ背景:      #09090b  (zinc-950)
カード背景:      #18181b  (zinc-900)
ホバー/入力欄:   #27272a  (zinc-800)
ボーダー通常:    #27272a  (zinc-800)
ボーダーホバー:  #3f3f46  (zinc-700)

テキスト 強:     zinc-100
テキスト 中:     zinc-300 / zinc-400
テキスト 弱:     zinc-500 / zinc-600

アクセント:      emerald-500  (#10b981)  ← ボタン・タブ・アクティブ状態
ライク色:        red-400
コメント色:      blue-400
```

---

## ページレイアウト

```
┌─────────────────────────────────────────────────────┐
│  Header (sticky, h-55px, backdrop-blur)             │
├──────┬──────────────────────────────────────────────┤
│      │  main (max-w-676px, mx-auto, px-21px)        │
│ Side │                                              │
│ bar  │  Feed                                        │
│      │  ├── PostCard                                │
│(89px │  ├── PostCard                                │
│ ←→  │  └── ...                                     │
│144px)│                                              │
└──────┴──────────────────────────────────────────────┘
```

- サイドバー: 閉=89px / 開=144px（デスクトップ常時表示、モバイルは隠れる）
- メインコンテンツ: サイドバー幅に合わせて `margin-left` が動く

---

## 現在の主要コンポーネントのコード

### Header.tsx（抜粋）

```tsx
<header className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-900/40 backdrop-blur-xl">
  <div className="h-[55px] flex items-center justify-between px-[21px] md:ml-[89px]">
    {/* ロゴ */}
    <h1 className="text-xl font-bold tracking-tight">
      <span className="text-emerald-400">drop</span>blox
    </h1>

    {/* ログイン済み */}
    <div className="flex items-center gap-[8px]">
      <Link href="/profile" className="flex items-center gap-[8px] px-[10px] py-[6px] rounded-[8px] hover:bg-white/[0.06]">
        <img src={avatarUrl} className="w-7 h-7 rounded-full ring-1 ring-white/[0.1]" />
        <span className="text-sm text-zinc-300 font-medium hidden sm:block">{username}</span>
      </Link>
      <button className="px-[10px] py-[6px] text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] rounded-[8px]">
        Sign out
      </button>
    </div>

    {/* 未ログイン */}
    <div className="flex items-center gap-[8px]">
      <button className="px-[10px] py-[6px] text-xs bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-[8px] flex items-center gap-[6px]">
        <GitHubIcon className="w-[14px] h-[14px]" /> GitHub
      </button>
      <button className="px-[10px] py-[6px] text-xs bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-[8px] flex items-center gap-[6px]">
        <RobloxIcon className="w-[14px] h-[14px]" /> Roblox
      </button>
    </div>
  </div>
</header>
```

---

### PostCard.tsx（抜粋 — フィードの投稿カード）

```tsx
<article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer
                    hover:border-zinc-700 hover:-translate-y-px transition-all duration-200 shadow-lg shadow-black/40">
  <div className="p-[21px] space-y-[13px]">

    {/* 投稿者 */}
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 ring-1 ring-white/[0.08]
                      flex items-center justify-center text-emerald-400 text-sm font-bold">
        A {/* username[0] */}
      </div>
      <div>
        <span className="font-medium text-sm">username</span>
        <span className="text-xs text-zinc-500 block">2h ago</span>
      </div>
    </div>

    {/* 本文（任意） */}
    <p className="text-sm text-zinc-300">このゲーム最高！</p>

    {/* ゲームサムネイル（正方形固定） */}
    <div className="rounded-xl overflow-hidden border border-zinc-800">
      <div className="relative">
        <img className="w-full aspect-square object-cover" />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* 下部オーバーレイ: ゲーム名 + Playボタン */}
        <div className="absolute inset-x-0 bottom-0 px-[16px] pb-[16px] flex items-end justify-between gap-[8px]">
          <div>
            <p className="font-bold text-[15px] text-white drop-shadow truncate">Game Name</p>
            <div className="flex gap-[10px] text-[11px] text-white/60 mt-[3px]">
              <span>1,234 playing</span>
              <span>5.6M visits</span>
            </div>
          </div>
          <a className="inline-flex items-center gap-[5px] px-[14px] py-[8px] text-xs font-bold
                        bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg shadow-lg">
            ▶ Play
          </a>
        </div>
        {/* ジャンルタグ（右上） */}
        <div className="absolute top-[10px] right-[10px]">
          <span className="px-[8px] py-[3px] bg-black/60 backdrop-blur-sm text-white/80 rounded-md text-[11px] border border-white/10">
            RPG
          </span>
        </div>
      </div>
    </div>

    {/* アクションバー */}
    <div className="flex items-center gap-[5px]">
      {/* ライク（アクティブ時: text-red-400 bg-red-500/10） */}
      <button className="flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px]
                         text-zinc-400 hover:text-red-400 hover:bg-red-500/10 min-w-[54px]">
        ♡ 12
      </button>
      {/* コメント（現在無効） */}
      <button className="flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px] text-zinc-600 cursor-not-allowed min-w-[54px]">
        💬 0
      </button>
      {/* コピーリンク */}
      <button className="flex items-center gap-1.5 text-xs px-[10px] py-[6px] rounded-[6px]
                         text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]">
        🔗
      </button>
    </div>
  </div>
</article>
```

---

### Sidebar.tsx（構造のみ）

```tsx
<aside className="fixed left-0 top-0 h-full bg-zinc-900/60 backdrop-blur-xl border-r border-white/[0.06] z-40
                  w-[89px] md:translate-x-0  {/* 閉じた状態 */}
                  w-[144px]                  {/* 開いた状態 */}">
  {/* New Post ボタン（emerald） */}
  <button className="bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-[8px]">
    ＋ New Post
  </button>

  {/* 検索（サイドバー内） */}
  <SearchBar />

  {/* ナビ */}
  <nav>
    <Link href="/">  🏠 Home   </Link>   {/* active: bg-white/[0.08] text-emerald-400 */}
    <Link href="/profile"> 👤 Profile </Link>
  </nav>
</aside>
```

---

### AuthModal.tsx（サインインモーダル）

```tsx
<div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-sm">
  {/* エメラルドグロウ（left-top） */}
  <div className="absolute -top-[100px] -left-[100px] w-[200px] h-[200px] bg-emerald-500/10 blur-[80px]" />

  {/* ロック アイコン */}
  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
    🔒
  </div>
  <h2 className="text-2xl font-bold">Welcome Back</h2>

  {/* GitHub: 白ボタン */}
  <button className="w-full h-12 bg-white text-zinc-950 font-semibold rounded-xl">
    Continue with GitHub
  </button>
  {/* Roblox: ダークボタン */}
  <button className="w-full h-12 bg-zinc-800 text-white rounded-xl border border-white/5">
    Continue with Roblox
  </button>
</div>
```

---

## 現在の未解決課題（改善依頼時に参照）

| # | 場所 | 課題 |
|---|------|------|
| 1 | Sidebar | デスクトップで「閉じる=フローティングボタン出現」が直感的でない |
| 2 | Header | ロゴ `dropblox` のブランド感が弱い |
| 3 | PostCard | サムネイル上のゲーム名が長い場合に `truncate` で見えなくなる |
| 4 | PostCard | コメントボタンが常に `cursor-not-allowed` で押せないのに表示されている |
| 5 | Profile | プロフィールカード (`profile/page.tsx:72`) に背景色・ボーダーなし |
| 6 | 全体 | モバイルでサイドバー外のタップ領域が狭い |
| 7 | PostDetailModal | 投稿者名がプロフィールページにリンクされていない |

---

## 変更時の制約

- **サムネイルは `aspect-square` 固定**（変えない）
- **Tailwind v4** を使用（`tailwind.config.js` なし、`globals.css` は `@import "tailwindcss"` のみ）
- **サイドバーと Header は連動**：片方を変えるともう片方の `margin-left` も変える必要がある
- **スペーシングは黄金比システムを維持**：`px-[21px]`・`py-[13px]`・`gap-[8px]` など
- **コメント機能は `NEXT_PUBLIC_ENABLE_COMMENTS` 環境変数で制御**（現在 OFF）

# dropblox

Robloxゲームの発見・共有プラットフォーム

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-Custom-red?style=for-the-badge)

## 概要

dropbloxは、Roblox開発者が自分のゲームを投稿し、他の開発者の作品を発見できるソーシャルプラットフォームです。

## 機能

- 🎮 **Robloxゲーム共有** - URLを貼り付けるだけでゲーム情報を自動取得
- 💬 **コメント機能** - 投稿へのコメントと返信
- ❤️ **いいね** - リアルタイムのいいね数表示
- ✏️ **編集・削除** - 自分の投稿のみ編集・削除可能
- 🔐 **GitHub認証** - 安全なOAuth認証
- ⚡ **リアルタイム同期** - 複数タブでの同期
- 📜 **無限スクロール** - 仮想化による高速スクロール（DOMノード50個制限）

## 技術スタック

- **フロントエンド**: Next.js 16 + React 19 + TypeScript
- **スタイリング**: Tailwind CSS 4
- **状態管理**: Zustand
- **データベース**: Supabase (PostgreSQL)
- **認証**: GitHub OAuth
- **リアルタイム**: Supabase Realtime

## 開発環境のセットアップ

### 必要条件

- Node.js 20以上
- npm または yarn

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/k153636/dropblox.git
cd dropblox

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な値を設定
```

### 環境変数

`.env.local`ファイルに以下を設定してください：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## Supabase セットアップ

### 必要なテーブル

#### profiles

```sql
create table profiles (
  id uuid references auth.users primary key,
  username text not null,
  avatar_url text,
  created_at timestamp with time zone default now()
);
```

#### posts

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  body text,
  preview_name text,
  preview_description text,
  preview_thumbnail text,
  preview_playing integer,
  preview_visits integer,
  author_id uuid references profiles(id),
  author_name text,
  likes integer default 0,
  created_at timestamp with time zone default now()
);
```

#### comments

```sql
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id),
  author_name text,
  body text not null,
  parent_id uuid references comments(id),
  created_at timestamp with time zone default now()
);
```

#### likes

```sql
create table likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id),
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);
```

## ライセンス

MIT License

create table comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references comments(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);
alter table comment_likes enable row level security;
create policy "Comment likes are viewable by everyone"
  on comment_likes for select using (true);
create policy "Users can manage own comment likes"
  on comment_likes for all using (auth.uid() = user_id);
create index idx_comment_likes_comment on comment_likes(comment_id);
create index idx_comment_likes_user on comment_likes(user_id);

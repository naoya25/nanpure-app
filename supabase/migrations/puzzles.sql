-- nanpure-app: 難易度マスタ + 問題（投稿）
-- 以前 `puzzle_posts` を作済みの場合は、先に実行してから本ファイルを流す:
--   drop table if exists public.puzzle_posts cascade;

create table if not exists public.difficulties (
  id smallserial primary key,
  code text not null unique,
  label text not null,
  sort_order int not null default 0
);

comment on table public.difficulties is 'ナンプレの難易度マスタ（puzzles.difficulty_id から参照）';

insert into public.difficulties (code, label, sort_order) values
  ('intro', '入門', 10),
  ('basic', '初級', 20),
  ('intermediate', '中級', 30),
  ('advanced', '上級', 40),
  ('expert', '難関', 50)
on conflict (code) do nothing;

create table if not exists public.puzzles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  puzzle_81 text not null
    constraint puzzles_puzzle_len check (char_length(puzzle_81) = 81)
    constraint puzzles_puzzle_chars check (puzzle_81 ~ '^[0-9]{81}$'),
  solution_81 text not null
    constraint puzzles_solution_len check (char_length(solution_81) = 81)
    constraint puzzles_solution_chars check (solution_81 ~ '^[1-9]{81}$'),
  description text,
  difficulty_id smallint not null references public.difficulties (id) on delete restrict
);

comment on table public.puzzles is '投稿されたナンプレ（問題・解答・説明・難易度）';
comment on column public.puzzles.puzzle_81 is '初期盤面。81 文字・0-9（0=空）';
comment on column public.puzzles.solution_81 is '完成盤面。81 文字・1-9';
comment on column public.puzzles.description is '説明・メモ（任意）';
comment on column public.puzzles.difficulty_id is 'difficulties.id への FK';

create index if not exists puzzles_created_at_idx
  on public.puzzles (created_at desc);

create index if not exists puzzles_difficulty_id_idx
  on public.puzzles (difficulty_id);

alter table public.difficulties enable row level security;
alter table public.puzzles enable row level security;

-- 難易度は参照のみ（クライアントはマスタを読むだけ）
create policy "difficulties_select_public"
  on public.difficulties
  for select
  to anon, authenticated
  using (true);

-- 問題: 閲覧・新規投稿（更新・削除はポリシーなし）
create policy "puzzles_select_public"
  on public.puzzles
  for select
  to anon, authenticated
  using (true);

create policy "puzzles_insert_public"
  on public.puzzles
  for insert
  to anon, authenticated
  with check (true);

grant select on table public.difficulties to anon, authenticated;
grant select, insert on table public.puzzles to anon, authenticated;

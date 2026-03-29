-- nanpure-app: 問題（投稿）
-- 以前 `puzzle_posts` / `difficulties` を作済みの場合は、環境に応じて drop / ALTER で整理してから適用する。

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
  level int not null
    constraint puzzles_level_range check (level >= 1 and level <= 100)
);

comment on table public.puzzles is '投稿されたナンプレ（問題・解答・説明・レベル）';
comment on column public.puzzles.puzzle_81 is '初期盤面。81 文字・0-9（0=空）';
comment on column public.puzzles.solution_81 is '完成盤面。81 文字・1-9';
comment on column public.puzzles.description is '説明・メモ（任意）';
comment on column public.puzzles.level is
  '難易度レベル 1..100。帯の目安: 初級 1–20 / 中級 21–50 / 上級 51–100。値の決定は必要な解法テクニックの深度などアプリ側ロジックで行う想定。';

create index if not exists puzzles_created_at_idx
  on public.puzzles (created_at desc);

create index if not exists puzzles_level_idx
  on public.puzzles (level);

alter table public.puzzles enable row level security;

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

grant select, insert on table public.puzzles to anon, authenticated;

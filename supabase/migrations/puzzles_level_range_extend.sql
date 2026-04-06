-- 未解決は 100 + 残り空マス（最大 181）を `level` に載せるため、上限を拡張する

alter table public.puzzles drop constraint if exists puzzles_level_range;

alter table public.puzzles add constraint puzzles_level_range
  check (level >= 1 and level <= 200);

comment on column public.puzzles.level is
  '難易度レベル 1..200。解けた問題はおおむそ 50–100、未解決は 100 + 残り空マス（最大 181）などアプリ側ロジックで決定。';

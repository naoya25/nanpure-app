-- 論理解法テクニックのマスタと、問題ごとの解答（自動実行）分析結果・使用回数
-- アプリの TechniqueId / TECHNIQUE_LABELS と整合させる。新テクニック追加時はマスタに INSERT を足す。

-- テクニック一覧（外部キー参照用）
create table if not exists public.solving_techniques (
  id text primary key
    constraint solving_techniques_id_check
      check (id ~ '^[A-Z][A-Z0-9_]*$'),
  sort_order int not null,
  label_ja text not null,
  unique (sort_order)
);

comment on table public.solving_techniques is '論理解法テクニックのマスタ（アプリ TechniqueId と同一の id）';
comment on column public.solving_techniques.sort_order is '難易度順の適用順（TECHNIQUE_LABELS と同じ並び）';
comment on column public.solving_techniques.label_ja is '表示用ラベル（ドキュメント・SQL確認用。アプリの表示名の正はコード側でもよい）';

insert into public.solving_techniques (id, sort_order, label_ja) values
  ('FULL_HOUSE', 1, 'フルハウス'),
  ('SINGLE', 2, 'シングル'),
  ('HIDDEN_SINGLE', 3, '隠れシングル'),
  ('PENCIL_MARK', 4, 'ペンシルマーク'),
  ('MEMO_SINGLE', 5, 'メモ1確定'),
  ('POINTING', 6, 'ポインティング'),
  ('BOX_LINE_REDUCTION', 7, 'ボックス・ライン削減'),
  ('PAIR', 8, 'ペア'),
  ('TRIPLE', 9, 'トリプル'),
  ('QUAD', 10, 'クァッド'),
  ('HIDDEN_PAIR', 11, '隠れペア'),
  ('HIDDEN_TRIPLE', 12, '隠れトリプル'),
  ('HIDDEN_QUAD', 13, '隠れクァッド'),
  ('FISH_22', 14, 'fish22（X-Wing）'),
  ('FISH_33', 15, 'fish33（Swordfish）'),
  ('FISH_44', 16, 'fish44（Jellyfish）'),
  ('FISH_55', 17, 'fish55'),
  ('FISH_66', 18, 'fish66'),
  ('FISH_77', 19, 'fish77'),
  ('FISH_88', 20, 'fish88'),
  ('SKYSCRAPER', 21, 'スカイスクレーパー'),
  ('TWO_STRING_KITE', 22, 'ツーストリング・カイト'),
  ('TURBO_FISH', 23, 'ターボフィッシュ'),
  ('XY_WING', 24, 'XY-Wing'),
  ('XYZ_WING', 25, 'XYZ-Wing'),
  ('WXYZ_WING', 26, 'WXYZ-Wing'),
  ('W_WING', 27, 'W-Wing'),
  ('UNIQUE_RECTANGLE', 28, 'ユニーク長方形'),
  ('BUG_PLUS_1', 29, 'BUG+1'),
  ('XY_CHAIN', 30, 'XY-Chain'),
  ('X_CHAIN', 31, 'X-Chain'),
  ('X_CYCLE', 32, 'X-Cycle'),
  ('ALS_XZ', 33, 'ALS-XZ'),
  ('AIC', 34, 'AIC')
on conflict (id) do nothing;

-- 1 回分の「テクニックランナーによる解答分析」（同一問題に複数行可・再分析用）
create table if not exists public.puzzle_solve_analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  puzzle_id uuid not null
    references public.puzzles (id) on delete cascade,
  source text,
  solved boolean not null,
  empty_cells_remaining smallint not null
    constraint puzzle_solve_analyses_empty_cells_check
      check (empty_cells_remaining >= 0 and empty_cells_remaining <= 81),
  finished_because_no_change boolean not null,
  conflict_cell_count smallint not null default 0
    constraint puzzle_solve_analyses_conflict_cell_count_check
      check (conflict_cell_count >= 0 and conflict_cell_count <= 81)
);

comment on table public.puzzle_solve_analyses is '問題に対する論理テクニック自動解答の 1 実行分のメタ情報';
comment on column public.puzzle_solve_analyses.source is '記録元の識別子（例: CLI スクリプト名・アプリバージョン）。任意';
comment on column public.puzzle_solve_analyses.solved is '実行後の盤面が solution_81 と一致したか';
comment on column public.puzzle_solve_analyses.empty_cells_remaining is '実行終了時点の空マス数（value=0 のマス数）';
comment on column public.puzzle_solve_analyses.finished_because_no_change is 'ランナーが「1 周して変更なし」で終了したか（安全弾で打ち切りのとき false）';
comment on column public.puzzle_solve_analyses.conflict_cell_count is 'solution_81 との不整合確定マス数（検知時はランナー停止。通常 0）';

create index if not exists puzzle_solve_analyses_puzzle_id_idx
  on public.puzzle_solve_analyses (puzzle_id, created_at desc);

-- 上記分析に紐づく、テクニック別の適用回数（ステップ数）
create table if not exists public.puzzle_solve_technique_usage (
  analysis_id uuid not null
    references public.puzzle_solve_analyses (id) on delete cascade,
  technique_id text not null
    references public.solving_techniques (id),
  step_count int not null
    constraint puzzle_solve_technique_usage_step_count_check
      check (step_count > 0),
  primary key (analysis_id, technique_id)
);

comment on table public.puzzle_solve_technique_usage is '1 回の分析におけるテクニックごとの使用回数（0 回のテクニックは行を持たない）';
comment on column public.puzzle_solve_technique_usage.step_count is 'そのテクニックが適用されたステップ数（ログの step 行数）';

create index if not exists puzzle_solve_technique_usage_technique_id_idx
  on public.puzzle_solve_technique_usage (technique_id);

-- RLS（puzzles と同様: 閲覧・追加。更新・削除はポolicy なし）
alter table public.solving_techniques enable row level security;
alter table public.puzzle_solve_analyses enable row level security;
alter table public.puzzle_solve_technique_usage enable row level security;

create policy "solving_techniques_select_public"
  on public.solving_techniques for select to anon, authenticated using (true);

-- insert/update/delete はポリシーなし（RLS により anon / authenticated は不可。マスタはマイグレーションで更新）

create policy "puzzle_solve_analyses_select_public"
  on public.puzzle_solve_analyses for select to anon, authenticated using (true);

create policy "puzzle_solve_analyses_insert_public"
  on public.puzzle_solve_analyses for insert to anon, authenticated with check (true);

create policy "puzzle_solve_technique_usage_select_public"
  on public.puzzle_solve_technique_usage for select to anon, authenticated using (true);

create policy "puzzle_solve_technique_usage_insert_public"
  on public.puzzle_solve_technique_usage for insert to anon, authenticated with check (true);

grant select on table public.solving_techniques to anon, authenticated;
grant select, insert on table public.puzzle_solve_analyses to anon, authenticated;
grant select, insert on table public.puzzle_solve_technique_usage to anon, authenticated;

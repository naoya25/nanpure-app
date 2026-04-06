-- 分析 1 行とテクニック使用行をまとめて挿入（RLS 下で二段 insert の失敗時に孤立行が残らないよう 1 トランザクションにする）

create or replace function public.insert_puzzle_solve_analysis_with_usage(
  p_puzzle_id uuid,
  p_source text,
  p_solved boolean,
  p_empty_cells_remaining smallint,
  p_finished_because_no_change boolean,
  p_conflict_cell_count smallint,
  p_usage jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.puzzle_solve_analyses (
    puzzle_id,
    source,
    solved,
    empty_cells_remaining,
    finished_because_no_change,
    conflict_cell_count
  ) values (
    p_puzzle_id,
    p_source,
    p_solved,
    p_empty_cells_remaining,
    p_finished_because_no_change,
    p_conflict_cell_count
  )
  returning id into v_id;

  insert into public.puzzle_solve_technique_usage (analysis_id, technique_id, step_count)
  select
    v_id,
    (elem->>'technique_id')::text,
    (elem->>'step_count')::int
  from jsonb_array_elements(coalesce(p_usage, '[]'::jsonb)) as elem
  where (elem->>'step_count')::int > 0;

  return v_id;
end;
$$;

comment on function public.insert_puzzle_solve_analysis_with_usage(
  uuid, text, boolean, smallint, boolean, smallint, jsonb
) is
  'puzzle_solve_analyses に 1 行挿入し、p_usage の配列に従い puzzle_solve_technique_usage をまとめて挿入する。';

grant execute on function public.insert_puzzle_solve_analysis_with_usage(
  uuid, text, boolean, smallint, boolean, smallint, jsonb
) to anon, authenticated;

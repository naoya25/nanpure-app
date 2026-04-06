-- `level` の再計算 CLI などから `puzzles` を更新できるようにする（従来は select/insert のみ）

grant update on table public.puzzles to anon, authenticated;

create policy "puzzles_update_public"
  on public.puzzles
  for update
  to anon, authenticated
  using (true)
  with check (true);

comment on policy "puzzles_update_public" on public.puzzles is
  'anon/authenticated による更新を許可。本番では service_role や限定ポリシーへ寄せる余地あり。';

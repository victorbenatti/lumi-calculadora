alter table public.financeiro_configuracoes enable row level security;
alter table public.financeiro_retiradas enable row level security;

drop policy if exists "Authenticated users can read financial configs" on public.financeiro_configuracoes;
drop policy if exists "Authenticated users can insert financial configs" on public.financeiro_configuracoes;
drop policy if exists "Authenticated users can update financial configs" on public.financeiro_configuracoes;
drop policy if exists "Authenticated users can delete financial configs" on public.financeiro_configuracoes;

create policy "Authenticated users can read financial configs"
on public.financeiro_configuracoes
for select
to authenticated
using (true);

create policy "Authenticated users can insert financial configs"
on public.financeiro_configuracoes
for insert
to authenticated
with check (true);

create policy "Authenticated users can update financial configs"
on public.financeiro_configuracoes
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete financial configs"
on public.financeiro_configuracoes
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read financial withdrawals" on public.financeiro_retiradas;
drop policy if exists "Authenticated users can insert financial withdrawals" on public.financeiro_retiradas;
drop policy if exists "Authenticated users can update financial withdrawals" on public.financeiro_retiradas;
drop policy if exists "Authenticated users can delete financial withdrawals" on public.financeiro_retiradas;

create policy "Authenticated users can read financial withdrawals"
on public.financeiro_retiradas
for select
to authenticated
using (true);

create policy "Authenticated users can insert financial withdrawals"
on public.financeiro_retiradas
for insert
to authenticated
with check (true);

create policy "Authenticated users can update financial withdrawals"
on public.financeiro_retiradas
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete financial withdrawals"
on public.financeiro_retiradas
for delete
to authenticated
using (true);

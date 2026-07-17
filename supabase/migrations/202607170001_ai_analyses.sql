create table if not exists public.analises_ia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,
  periodo text not null check (periodo in ('current-month', 'last-30-days', 'last-90-days', 'all')),
  data_inicio date,
  data_fim date not null,
  relatorio jsonb not null,
  modelo text not null,
  versao_prompt text not null,
  contagem_registros jsonb not null default '{}'::jsonb,
  tokens_entrada integer,
  tokens_saida integer
);

create index if not exists analises_ia_created_by_created_at_idx
  on public.analises_ia (created_by, created_at desc);

alter table public.analises_ia enable row level security;

create policy "Users can read their own AI analyses"
on public.analises_ia
for select
to authenticated
using (created_by = auth.uid());

create policy "Users can create their own AI analyses"
on public.analises_ia
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can delete their own AI analyses"
on public.analises_ia
for delete
to authenticated
using (created_by = auth.uid());


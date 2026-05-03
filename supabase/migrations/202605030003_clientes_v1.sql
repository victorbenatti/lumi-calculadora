create table if not exists public.clientes (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nome text,
  whatsapp text,
  email text not null,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text
);

alter table public.clientes enable row level security;

drop policy if exists "Clientes can read own profile" on public.clientes;
drop policy if exists "Clientes can insert own profile" on public.clientes;
drop policy if exists "Clientes can update own profile" on public.clientes;

create policy "Clientes can read own profile"
on public.clientes
for select
to authenticated
using (auth.uid() = id);

create policy "Clientes can insert own profile"
on public.clientes
for insert
to authenticated
with check (auth.uid() = id);

create policy "Clientes can update own profile"
on public.clientes
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.set_clientes_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clientes_updated_at on public.clientes;

create trigger set_clientes_updated_at
before update on public.clientes
for each row
execute function public.set_clientes_updated_at();

comment on table public.clientes is
  'Perfil opcional de clientes da Lumi. Criado pelo fluxo de cliente, sem trigger em auth.users para manter contas administrativas separadas.';

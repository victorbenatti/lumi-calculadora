-- ==============================================================================
-- Migração: Lean Checkout & Registro de Pedidos (Bloco 2)
-- Tabelas: pedidos e itens_pedido
-- ==============================================================================

-- 1. Sequence para numeração sequencial dos pedidos a partir de 1042
create sequence if not exists public.pedidos_numero_seq start with 1042;

-- 2. Tabela de Pedidos
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  created_at timestamptz not null default now(),
  cliente_nome text not null,
  cliente_whatsapp text not null,
  tipo_entrega text not null check (tipo_entrega in ('envio', 'retirada')),
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  forma_pagamento text not null check (forma_pagamento in ('pix', 'cartao')),
  subtotal numeric not null check (subtotal >= 0),
  desconto numeric not null default 0 check (desconto >= 0),
  total numeric not null check (total >= 0),
  status text not null default 'aguardando_confirmacao' check (status in ('aguardando_confirmacao', 'pago', 'enviado', 'cancelado')),
  observacoes text,
  origem text not null default 'checkout_express'
);

-- 3. Tabela de Itens do Pedido
create table if not exists public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  nome_produto text not null,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric not null check (preco_unitario >= 0),
  preco_total numeric not null check (preco_total >= 0),
  imagem_url text,
  created_at timestamptz not null default now()
);

-- 4. Função e Trigger para autogerar código #LUMI-XXXX se não fornecido
create or replace function public.gerar_codigo_pedido()
returns trigger as $$
declare
  next_num integer;
begin
  if new.codigo is null or trim(new.codigo) = '' then
    next_num := nextval('public.pedidos_numero_seq');
    new.codigo := '#LUMI-' || next_num::text;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_gerar_codigo_pedido on public.pedidos;
create trigger trigger_gerar_codigo_pedido
before insert on public.pedidos
for each row
execute function public.gerar_codigo_pedido();

-- 5. Índices de performance
create index if not exists idx_pedidos_codigo on public.pedidos (codigo);
create index if not exists idx_pedidos_status on public.pedidos (status);
create index if not exists idx_pedidos_created_at on public.pedidos (created_at desc);
create index if not exists idx_itens_pedido_pedido_id on public.itens_pedido (pedido_id);

-- 6. Habilitação de RLS (Row Level Security)
alter table public.pedidos enable row level security;
alter table public.itens_pedido enable row level security;

-- Políticas de Pedidos
drop policy if exists "Anyone can insert pedidos" on public.pedidos;
create policy "Anyone can insert pedidos"
on public.pedidos
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can select pedidos" on public.pedidos;
create policy "Anyone can select pedidos"
on public.pedidos
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can update pedidos" on public.pedidos;
create policy "Authenticated users can update pedidos"
on public.pedidos
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete pedidos" on public.pedidos;
create policy "Authenticated users can delete pedidos"
on public.pedidos
for delete
to authenticated
using (true);

-- Políticas de Itens do Pedido
drop policy if exists "Anyone can insert itens_pedido" on public.itens_pedido;
create policy "Anyone can insert itens_pedido"
on public.itens_pedido
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can select itens_pedido" on public.itens_pedido;
create policy "Anyone can select itens_pedido"
on public.itens_pedido
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can update itens_pedido" on public.itens_pedido;
create policy "Authenticated users can update itens_pedido"
on public.itens_pedido
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete itens_pedido" on public.itens_pedido;
create policy "Authenticated users can delete itens_pedido"
on public.itens_pedido
for delete
to authenticated
using (true);

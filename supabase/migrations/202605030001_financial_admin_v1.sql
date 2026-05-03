create extension if not exists pgcrypto;

create table if not exists public.financeiro_configuracoes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null default 'Regra padrao Lumi V1',
  reposicao_percentual numeric not null default 1.00,
  caixa_percentual numeric not null default 0.10,
  split_voce_percentual numeric not null default 0.50,
  split_mae_percentual numeric not null default 0.50,
  ativo boolean not null default true
);

insert into public.financeiro_configuracoes (
  nome,
  reposicao_percentual,
  caixa_percentual,
  split_voce_percentual,
  split_mae_percentual,
  ativo
)
select
  'Regra padrao Lumi V1',
  1.00,
  0.10,
  0.50,
  0.50,
  true
where not exists (
  select 1
  from public.financeiro_configuracoes
  where ativo = true
);

create table if not exists public.financeiro_retiradas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pessoa text not null check (pessoa in ('voce', 'mae')),
  valor numeric not null check (valor > 0),
  data_retirada date not null default current_date,
  observacao text
);

alter table public.vendas
  add column if not exists custo_unitario_snapshot numeric,
  add column if not exists reposicao_snapshot numeric,
  add column if not exists lucro_bruto_snapshot numeric,
  add column if not exists reserva_caixa_snapshot numeric,
  add column if not exists lucro_distribuivel_snapshot numeric,
  add column if not exists lucro_voce_snapshot numeric,
  add column if not exists lucro_mae_snapshot numeric,
  add column if not exists financeiro_estimado boolean not null default false,
  add column if not exists financeiro_configuracao_id uuid references public.financeiro_configuracoes(id);

with regra as (
  select *
  from public.financeiro_configuracoes
  where ativo = true
  order by created_at desc
  limit 1
)
update public.vendas v
set
  custo_unitario_snapshot = p.custo_final_brl,
  reposicao_snapshot = p.custo_final_brl * regra.reposicao_percentual,
  lucro_bruto_snapshot = v.preco_venda - p.custo_final_brl,
  reserva_caixa_snapshot = (v.preco_venda - p.custo_final_brl) * regra.caixa_percentual,
  lucro_distribuivel_snapshot = (v.preco_venda - p.custo_final_brl) - ((v.preco_venda - p.custo_final_brl) * regra.caixa_percentual),
  lucro_voce_snapshot = ((v.preco_venda - p.custo_final_brl) - ((v.preco_venda - p.custo_final_brl) * regra.caixa_percentual)) * regra.split_voce_percentual,
  lucro_mae_snapshot = ((v.preco_venda - p.custo_final_brl) - ((v.preco_venda - p.custo_final_brl) * regra.caixa_percentual)) * regra.split_mae_percentual,
  financeiro_estimado = true,
  financeiro_configuracao_id = regra.id
from public.produtos p, regra
where v.produto_id = p.id
  and v.custo_unitario_snapshot is null;

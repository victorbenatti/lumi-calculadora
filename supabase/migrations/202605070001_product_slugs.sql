alter table public.produtos
add column if not exists slug text;

create or replace function public.lumi_slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(
      translate(
        regexp_replace(
          lower(coalesce(value, '')),
          'n[[:space:]]*[°ºo]?[[:space:]]*([0-9]+)',
          'n\1',
          'g'
        ),
        'áàãâäéèêëíìîïóòõôöúùûüçñº°ª',
        'aaaaaeeeeiiiiooooouuuucnooa'
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    '-+',
    '-',
    'g'
  ));
$$;

create or replace function public.set_produto_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix integer := 2;
begin
  if new.slug is not null and length(trim(new.slug)) > 0 then
    new.slug := public.lumi_slugify(new.slug);
    return new;
  end if;

  base_slug := public.lumi_slugify(new.nome);

  if base_slug is null or base_slug = '' then
    base_slug := 'produto';
  end if;

  candidate_slug := base_slug;

  while exists (
    select 1
    from public.produtos p
    where p.slug = candidate_slug
      and p.id <> new.id
  ) loop
    candidate_slug := base_slug || '-' || suffix;
    suffix := suffix + 1;
  end loop;

  new.slug := candidate_slug;
  return new;
end;
$$;

drop trigger if exists produtos_set_slug on public.produtos;

create trigger produtos_set_slug
before insert or update on public.produtos
for each row
when (new.slug is null or length(trim(new.slug)) = 0)
execute function public.set_produto_slug();

update public.produtos
set slug = null
where slug is null or length(trim(slug)) = 0;

create unique index if not exists produtos_slug_unique_idx
on public.produtos (slug)
where slug is not null;

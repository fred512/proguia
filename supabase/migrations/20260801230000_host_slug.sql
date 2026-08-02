-- Endereço público de cada anfitrião: /anfitriao/{slug}.

-- translate() em vez da extensão unaccent: sem dependência extra, e a função
-- fica IMMUTABLE de verdade (unaccent é STABLE por depender do dicionário).
create or replace function public.slugify(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(
      lower(translate(
        coalesce(p_text, ''),
        'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      )),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- Slug deriva do nome, mas não pode colidir: dois anfitriões homônimos viram
-- "maria-souza" e "maria-souza-2".
create or replace function public.set_guide_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text;
  v_slug text;
  v_suffix int := 1;
begin
  -- Slug existente nunca é regerado: trocar o nome não pode quebrar um link
  -- que já foi compartilhado.
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  v_base := coalesce(nullif(public.slugify(new.name), ''), 'anfitriao');
  v_slug := v_base;

  while exists (select 1 from public.guides where slug = v_slug and id <> new.id) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix;
  end loop;

  new.slug := v_slug;
  return new;
end;
$$;

drop trigger if exists guides_set_slug on public.guides;
create trigger guides_set_slug before insert or update of name on public.guides
for each row execute function public.set_guide_slug();

-- Preenche quem já está cadastrado.
update public.guides set name = name where slug is null;

-- `slug` fica fora do grant de colunas de 20260801200000, então o painel não
-- consegue alterá-lo: quem define é o banco.

-- Única porta de entrada para uma solicitação. O cliente é anônimo, então
-- nada que ele manda sobre dinheiro ou capacidade é aceito: o valor é
-- recalculado aqui a partir de routes.price_per_day e packages.multiplier.

create or replace function public.create_request(
  p_route_id uuid,
  p_package text,
  p_days int,
  p_people int,
  p_start_date date,
  p_client_name text,
  p_client_email text,
  p_client_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_route public.routes;
  v_multiplier numeric;
  v_total numeric;
  v_recent int;
  v_id uuid;
  v_name text := trim(coalesce(p_client_name, ''));
  v_email text := lower(trim(coalesce(p_client_email, '')));
  v_phone text := trim(coalesce(p_client_phone, ''));
begin
  select * into v_route from public.routes where id = p_route_id and active;
  if not found then
    raise exception 'Roteiro indisponível.';
  end if;

  if not exists (
    select 1 from public.guides g where g.id = v_route.guide_id and g.published
  ) then
    raise exception 'Guia indisponível no momento.';
  end if;

  select multiplier into v_multiplier from public.packages where name = p_package;
  if v_multiplier is null then
    raise exception 'Pacote inválido.';
  end if;

  if p_days is null or p_days < 1 or p_days > 30 then
    raise exception 'Quantidade de dias inválida.';
  end if;

  if p_people is null or p_people < 1 then
    raise exception 'Quantidade de pessoas inválida.';
  end if;

  if p_people > v_route.capacity then
    raise exception 'Este roteiro comporta até % pessoas.', v_route.capacity;
  end if;

  if p_start_date is not null and p_start_date < current_date then
    raise exception 'A data de início não pode estar no passado.';
  end if;

  if v_name = '' then
    raise exception 'Informe seu nome.';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'E-mail inválido.';
  end if;

  if length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 8 then
    raise exception 'Telefone inválido.';
  end if;

  -- Trava de flood: o endpoint é anônimo por definição, então sem isto uma
  -- única pessoa consegue encher a caixa de entrada da guia.
  select count(*) into v_recent
  from public.requests
  where client_email = v_email
    and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Muitas solicitações enviadas na última hora. Tente novamente mais tarde.';
  end if;

  v_total := round(v_route.price_per_day * p_days * v_multiplier, 2);

  insert into public.requests (
    guide_id, route_id, route_title, package,
    price_per_day, total_amount,
    client_name, client_email, client_phone,
    start_date, days, people
  ) values (
    v_route.guide_id, v_route.id, v_route.title, p_package,
    v_route.price_per_day, v_total,
    v_name, v_email, v_phone,
    p_start_date, p_days, p_people
  )
  returning id into v_id;

  -- Devolve só o que o próprio cliente acabou de enviar.
  return jsonb_build_object('id', v_id, 'total_amount', v_total);
end;
$$;

revoke all on function public.create_request(uuid, text, int, int, date, text, text, text) from public;
grant execute on function public.create_request(uuid, text, int, int, date, text, text, text) to anon, authenticated;

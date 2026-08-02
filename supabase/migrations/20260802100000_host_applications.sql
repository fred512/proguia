-- Candidatura pública para virar anfitrião.
--
-- Não entrega convite: gera uma linha que o administrador revisa em
-- /painel/admin e, se aprovar, gera o link de convite ali. Entregar o link
-- automaticamente transformaria o cadastro por convite em cadastro aberto.

create table if not exists public.host_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  region text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'invited', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists host_applications_status_idx
  on public.host_applications (status, created_at desc);

alter table public.host_applications enable row level security;

-- Mesmo desenho de `requests`: nenhuma policy para anon, nem SELECT nem
-- INSERT. Sem isso, qualquer visitante leria nome, e-mail e telefone de todos
-- os candidatos. A gravação passa pelo RPC abaixo.
create policy "host_applications_admin_read" on public.host_applications
  for select to authenticated using (public.is_platform_admin());

create policy "host_applications_admin_update" on public.host_applications
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop trigger if exists host_applications_set_updated_at on public.host_applications;
create trigger host_applications_set_updated_at before update on public.host_applications
for each row execute function public.set_updated_at();

create or replace function public.create_host_application(
  p_name text,
  p_email text,
  p_phone text default null,
  p_region text default null,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_recent int;
begin
  if v_name = '' then
    raise exception 'Informe seu nome.';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'E-mail inválido.';
  end if;

  if exists (select 1 from public.host_applications
              where email = v_email and status in ('new', 'contacted')) then
    return jsonb_build_object('status', 'already_pending');
  end if;

  -- Endpoint anônimo: sem trava, uma pessoa enche a fila de curadoria.
  select count(*) into v_recent
    from public.host_applications
   where created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'Muitas candidaturas agora. Tente novamente mais tarde.';
  end if;

  insert into public.host_applications (name, email, phone, region, message)
  values (
    v_name,
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_region, '')), ''),
    nullif(trim(coalesce(p_message, '')), '')
  );

  return jsonb_build_object('status', 'created');
end;
$$;

revoke all on function public.create_host_application(text, text, text, text, text) from public;
grant execute on function public.create_host_application(text, text, text, text, text) to anon, authenticated;

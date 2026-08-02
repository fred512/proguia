-- Papel de administrador da plataforma e cadastro de guia por convite.

-- ---------------------------------------------------------------------------
-- Administrador
-- ---------------------------------------------------------------------------

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS ligada e sem policy alguma: nenhum cliente lê ou escreve esta tabela
-- diretamente. Só o service_role e a função abaixo enxergam o conteúdo.
alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Convites
-- ---------------------------------------------------------------------------

create table if not exists public.guide_invites (
  token uuid primary key default gen_random_uuid(),
  email text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null
);

create index if not exists guide_invites_open_idx
  on public.guide_invites (expires_at) where used_at is null;

alter table public.guide_invites enable row level security;

-- Sem policy para anon: quem tem o link não precisa ler a tabela, o resgate
-- passa pelo RPC. Listar convites é privilégio de administrador.
create policy "invites_admin_read" on public.guide_invites
  for select to authenticated using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- O perfil de guia deixa de nascer sozinho
-- ---------------------------------------------------------------------------

-- Antes, qualquer conta criada virava guia automaticamente. Com convite, a
-- linha em `guides` passa a ser criada só pelo resgate. O trigger sai de cena.
--
-- Isto vale para OAuth e magic link igualmente: signInWithOAuth não carrega
-- metadados próprios até o banco, então validar o token no trigger só
-- funcionaria para um dos dois caminhos.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_guide();

create or replace function public.redeem_guide_invite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_invite public.guide_invites;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Faça login antes de usar o convite.';
  end if;

  -- Já é guia: resgate é idempotente, não consome outro convite.
  if exists (select 1 from public.guides where id = v_uid) then
    return jsonb_build_object('status', 'already_guide');
  end if;

  select email into v_email from auth.users where id = v_uid;

  select * into v_invite
    from public.guide_invites
   where token = p_token
     and used_at is null
     and expires_at > now()
   for update;

  if not found then
    raise exception 'Convite inválido, já utilizado ou expirado.';
  end if;

  if v_invite.email is not null
     and lower(v_invite.email) <> lower(coalesce(v_email, '')) then
    raise exception 'Este convite foi emitido para outro e-mail.';
  end if;

  select coalesce(
           raw_user_meta_data->>'full_name',
           raw_user_meta_data->>'name',
           split_part(coalesce(email, 'guia'), '@', 1)
         )
    into v_name
    from auth.users where id = v_uid;

  insert into public.guides (id, name, email)
  values (v_uid, v_name, v_email);

  update public.guide_invites
     set used_at = now(), used_by = v_uid
   where token = p_token;

  return jsonb_build_object('status', 'created');
end;
$$;

revoke all on function public.redeem_guide_invite(uuid) from public;
grant execute on function public.redeem_guide_invite(uuid) to authenticated;

create or replace function public.create_guide_invite(p_email text default null, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas administradores emitem convites.';
  end if;

  insert into public.guide_invites (email, note, created_by)
  values (nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_note, '')), ''), (select auth.uid()))
  returning token into v_token;

  return jsonb_build_object('token', v_token);
end;
$$;

revoke all on function public.create_guide_invite(text, text) from public;
grant execute on function public.create_guide_invite(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Poderes do administrador
-- ---------------------------------------------------------------------------

create policy "guides_admin_read" on public.guides
  for select to authenticated using (public.is_platform_admin());

create policy "requests_admin_read" on public.requests
  for select to authenticated using (public.is_platform_admin());

create policy "routes_admin_read" on public.routes
  for select to authenticated using (public.is_platform_admin());

-- Publicar não é UPDATE direto: a coluna `published` não é concedida a
-- authenticated (ver 20260801200000), e administrador também é authenticated.
-- Passa por função, que registra a decisão num único ponto.
create or replace function public.set_guide_published(p_guide_id uuid, p_published boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas administradores publicam guias.';
  end if;

  update public.guides set published = p_published where id = p_guide_id;

  if not found then
    raise exception 'Guia não encontrada.';
  end if;
end;
$$;

revoke all on function public.set_guide_published(uuid, boolean) from public;
grant execute on function public.set_guide_published(uuid, boolean) to authenticated;

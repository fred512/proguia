-- O nome do perfil vinha sempre da conta do provedor, então quem entra com
-- Google aparece como "BoraeApp" em vez do nome que digitou na candidatura.
-- O convite passa a carregar um nome sugerido.

alter table public.guide_invites
  add column if not exists invited_name text;

create or replace function public.create_guide_invite(
  p_email text default null,
  p_note text default null,
  p_name text default null
)
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

  insert into public.guide_invites (email, note, invited_name, created_by)
  values (
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    nullif(trim(coalesce(p_name, '')), ''),
    (select auth.uid())
  )
  returning token into v_token;

  return jsonb_build_object('token', v_token);
end;
$$;

revoke all on function public.create_guide_invite(text, text, text) from public;
grant execute on function public.create_guide_invite(text, text, text) to authenticated;

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

  -- Nome do convite primeiro: veio da candidatura, onde a pessoa escreveu
  -- como quer ser chamada. O do provedor costuma ser apelido de conta.
  select coalesce(
           nullif(trim(coalesce(v_invite.invited_name, '')), ''),
           u.raw_user_meta_data->>'full_name',
           u.raw_user_meta_data->>'name',
           split_part(coalesce(u.email, 'anfitriao'), '@', 1)
         )
    into v_name
    from auth.users u where u.id = v_uid;

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

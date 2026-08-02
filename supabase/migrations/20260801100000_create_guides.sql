-- Perfil público de cada guia. O id é o próprio auth.users.id: um guia
-- autenticado é dono da sua linha, e o isolamento multi-guia sai de auth.uid().

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.guides (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  languages text not null default 'Português e Español',
  region text not null default 'Tríplice Fronteira · Paraguai',
  group_limit int not null default 6 check (group_limit between 1 and 30),
  bio text not null default '',
  photo_url text,
  slug text unique,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guides enable row level security;

-- O site público precisa mostrar a guia, então anon lê — mas só as publicadas.
create policy "guides_public_read" on public.guides
  for select to anon, authenticated using (published);

-- A guia enxerga a própria linha mesmo antes de publicar.
create policy "guides_read_own" on public.guides
  for select to authenticated using ((select auth.uid()) = id);

create policy "guides_update_own" on public.guides
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop trigger if exists guides_set_updated_at on public.guides;
create trigger guides_set_updated_at before update on public.guides
for each row execute function public.set_updated_at();

-- Não há policy de INSERT: a linha nasce do trigger de signup abaixo, para o
-- cliente nunca poder criar perfil de outro id.
create or replace function public.handle_new_guide()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.guides (id, name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'guia'), '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_guide();

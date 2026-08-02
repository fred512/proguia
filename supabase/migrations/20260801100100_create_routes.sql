-- Roteiros de cada guia. Substitui o array hardcoded de pages/index.vue.

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  title text not null,
  category text not null default '',
  description text not null default '',
  price_per_day numeric(10,2) not null check (price_per_day > 0),
  capacity int not null check (capacity between 1 and 30),
  cover_image text,
  highlights text[] not null default '{}',
  gallery jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routes_guide_id_idx on public.routes (guide_id);

alter table public.routes enable row level security;

-- Público lê só roteiro ativo de guia publicada.
create policy "routes_public_read" on public.routes
  for select to anon, authenticated
  using (
    active
    and exists (select 1 from public.guides g where g.id = routes.guide_id and g.published)
  );

-- A guia gerencia integralmente os próprios roteiros.
create policy "routes_read_own" on public.routes
  for select to authenticated using ((select auth.uid()) = guide_id);

create policy "routes_insert_own" on public.routes
  for insert to authenticated with check ((select auth.uid()) = guide_id);

create policy "routes_update_own" on public.routes
  for update to authenticated
  using ((select auth.uid()) = guide_id)
  with check ((select auth.uid()) = guide_id);

create policy "routes_delete_own" on public.routes
  for delete to authenticated using ((select auth.uid()) = guide_id);

drop trigger if exists routes_set_updated_at on public.routes;
create trigger routes_set_updated_at before update on public.routes
for each row execute function public.set_updated_at();

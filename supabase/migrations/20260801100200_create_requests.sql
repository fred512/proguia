-- Solicitações enviadas pelo cliente. Contêm dado pessoal de terceiro
-- (nome, e-mail, telefone), então o acesso é o mais fechado do schema.

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  route_id uuid references public.routes(id) on delete set null,

  -- Cópia congelada no momento do pedido: mudar preço ou apagar o roteiro
  -- depois não pode reescrever o histórico.
  route_title text not null,
  package text not null references public.packages(name),
  price_per_day numeric(10,2) not null,
  total_amount numeric(10,2) not null,

  client_name text not null,
  client_email text not null,
  client_phone text not null,

  start_date date,
  days int not null check (days between 1 and 30),
  people int not null check (people between 1 and 30),

  status text not null default 'new'
    check (status in ('new', 'contacted', 'confirmed', 'declined', 'archived')),
  notified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_guide_id_created_idx
  on public.requests (guide_id, created_at desc);

create index if not exists requests_pending_notification_idx
  on public.requests (created_at) where notified_at is null;

alter table public.requests enable row level security;

-- Nenhuma policy para anon, nem de SELECT nem de INSERT.
--
-- SELECT: sem isso, qualquer visitante do site leria nome, e-mail e telefone
-- de todos os clientes de todos os guias com uma chamada à API pública.
--
-- INSERT: a gravação passa obrigatoriamente pelo RPC create_request, que é
-- SECURITY DEFINER e recalcula o preço no servidor. Policy de insert aberta
-- permitiria forjar total_amount ou furar o limite de pessoas do roteiro.

create policy "requests_read_own" on public.requests
  for select to authenticated using ((select auth.uid()) = guide_id);

create policy "requests_update_own" on public.requests
  for update to authenticated
  using ((select auth.uid()) = guide_id)
  with check ((select auth.uid()) = guide_id);

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at before update on public.requests
for each row execute function public.set_updated_at();

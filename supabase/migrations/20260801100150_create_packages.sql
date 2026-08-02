-- Multiplicadores de pacote em tabela, não espalhados no código.
-- O browser lê daqui só para exibir a prévia; o RPC create_request lê daqui
-- para calcular o valor real. Fonte única, sem risco de divergirem.

create table if not exists public.packages (
  name text primary key,
  multiplier numeric(4,2) not null check (multiplier > 0),
  description text not null default '',
  position int not null default 0
);

insert into public.packages (name, multiplier, description, position) values
  ('Essencial', 1.00, 'Curadoria de roteiro e acompanhamento da guia.', 1),
  ('Conforto',  1.20, 'Mais flexibilidade e organização prévia de paradas.', 2),
  ('Completo',  1.35, 'Atenção ampliada aos detalhes do grupo.', 3)
on conflict (name) do nothing;

alter table public.packages enable row level security;

-- Leitura livre; escrita só por service_role (que ignora RLS).
create policy "packages_public_read" on public.packages
  for select to anon, authenticated using (true);

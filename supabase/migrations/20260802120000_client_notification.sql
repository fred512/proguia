-- Dois destinatários por solicitação: o anfitrião, que precisa saber que
-- chegou pedido, e o cliente, que precisa saber que o pedido foi recebido.
--
-- Colunas separadas porque os envios falham de forma independente. Com um
-- carimbo só, uma falha no segundo e-mail marcaria o primeiro como pendente e
-- geraria reenvio duplicado ao anfitrião.

alter table public.requests
  add column if not exists client_notified_at timestamptz;

create index if not exists requests_pending_client_notification_idx
  on public.requests (created_at) where client_notified_at is null;

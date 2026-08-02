-- Dispara a Edge Function notify-guide a cada minuto. Ela mesma decide se há
-- algo a enviar (notified_at is null), então rodar em vazio é barato.
--
-- PRÉ-REQUISITO: o secret abaixo precisa existir antes desta migração:
--   select vault.create_secret('<service_role_key>', 'project_service_role_key');
-- A chave nunca aparece no SQL versionado — só a referência ao vault.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

select cron.schedule(
  'notify-guide-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://xzzdwlnncfibmtdbxrcp.supabase.co/functions/v1/notify-guide',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'project_service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
) where not exists (select 1 from cron.job where jobname = 'notify-guide-every-minute');

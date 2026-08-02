-- Dois ajustes para o cadastro de guia funcionar de verdade.

-- 1. Os defaults de languages/region eram dados da Marcia. Numa plataforma
-- multi-guia isso faz todo guia novo nascer com o perfil de outra pessoa.
alter table public.guides alter column languages set default '';
alter table public.guides alter column region set default '';

-- Limpa apenas as linhas que ainda estão exatamente no default antigo, ou
-- seja, perfis que ninguém editou. Quem já escreveu algo não é tocado.
update public.guides
   set languages = ''
 where languages = 'Português e Español';

update public.guides
   set region = ''
 where region = 'Tríplice Fronteira · Paraguai';

-- 2. `published` decide se a guia aparece no site público. Com UPDATE amplo,
-- qualquer guia autenticada publicaria a si mesma chamando a API direto,
-- ignorando qualquer critério de curadoria. Grant por coluna resolve: a
-- policy continua permitindo editar a própria linha, mas `published` fica
-- fora do conjunto de colunas graváveis pelo cliente.
revoke update on table public.guides from authenticated;
grant update (name, email, phone, languages, region, group_limit, bio, photo_url)
  on table public.guides to authenticated;

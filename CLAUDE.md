# PersonalTravel

> PWA de roteiros privados pela Tríplice Fronteira. O visitante escolhe um anfitrião, vê seus roteiros e envia uma solicitação. O anfitrião gerencia perfil, roteiros e pedidos num painel próprio.

A pasta e o repositório ainda se chamam `ProGuia`; o produto se chama **PersonalTravel**.

## Vocabulário — importante

Nunca chame as pessoas cadastradas de **"guia"** na interface. Use **anfitrião / anfitriã**.

A Lei 8.623/1993 regulamenta "Guia de Turismo" como profissão, exigindo curso técnico e registro no Cadastur. A maioria dos cadastrados não tem essa formação, então a palavra cria exposição jurídica. Foi o motivo da troca de nome do produto.

No banco os identificadores continuam em inglês (`guides`, `guide_id`, `guide-photos`, `redeem_guide_invite`). Isso é intencional: identificador interno não é alegação pública. **Não renomeie o schema** por causa disso.

## Estado atual

**Área logada: pronta e funcionando.**
**Site público: ainda é o protótipo original, sem conexão com o banco.**

A página `/` tem os três roteiros hardcoded em `pages/index.vue`, texto e foto da Marcia fixos, e um formulário que só avança de etapa sem gravar nada. Ela não lê do Supabase. Editar um roteiro no painel não muda nada nela.

### Próxima fatia (não iniciada)

1. `/` vira apresentação institucional do PersonalTravel, sem perfil fixo de ninguém
2. Listagem de anfitriões publicados, com filtro por região
3. `/anfitriao/{slug}` com perfil e roteiros vindos do banco
4. Formulário de pedido chamando o RPC `create_request`
5. Exibir crédito das fotos do Commons (obrigação de licença — ver abaixo)
6. Candidatura pública para virar anfitrião (`host_applications` + RPC, mesmo padrão de `requests`)

## Infraestrutura

| Serviço | Detalhe |
|---|---|
| Supabase | projeto `PersonalTravel`, ref `xzzdwlnncfibmtdbxrcp`, região `sa-east-1` |
| Conta Supabase | `carlosfredericodemborges@gmail.com` — **não** a `fred512`, que tem ProTarefa e Provisiona |
| E-mail | SMTP do Gmail, conta `personaltravel1br@gmail.com` (sem domínio próprio) |
| Hospedagem | Vercel, saída estática |

### Variáveis

`.env` está no `.gitignore`:
```
NUXT_PUBLIC_SUPABASE_URL=https://xzzdwlnncfibmtdbxrcp.supabase.co
NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Nunca no `.env` nem em conversa: `service_role` / `sb_secret_...` e `RESEND_API_KEY`. Essas vão em Supabase → Edge Functions → Secrets, e no vault via `select vault.create_secret(...)`.

## Banco

Migrações em `supabase/migrations/`, todas aplicadas:

| Arquivo | Conteúdo |
|---|---|
| `..100000_create_guides` | tabela `guides`, id = `auth.users.id` |
| `..100100_create_routes` | `routes` por anfitrião |
| `..100150_create_packages` | multiplicadores Essencial 1.0 / Conforto 1.2 / Completo 1.35 |
| `..100200_create_requests` | `requests` com snapshot de título e valor |
| `..100300_create_request_rpc` | `create_request()` |
| `..100400_notify_guide_cron` | pg_cron chamando a Edge Function a cada minuto |
| `..200000_guide_onboarding` | limpa defaults, grant por coluna |
| `..210000_guide_photos_storage` | bucket `guide-photos` + policies |
| `..220000_admin_and_invites` | `platform_admins`, `guide_invites`, RPCs |
| `..230000_host_slug` | `slugify()` e geração automática de slug |
| `20260802100000_host_applications` | candidatura pública + RPC com trava de flood |
| `20260802120000_client_notification` | `client_notified_at` em `requests` |

### Decisões de segurança que não devem ser desfeitas

**`requests` não tem policy nenhuma para `anon`** — nem SELECT nem INSERT. Sem isso qualquer visitante leria nome, e-mail e telefone de todos os clientes de todos os anfitriões pela API pública. A gravação passa obrigatoriamente pelo RPC `create_request`, que é `SECURITY DEFINER`, recalcula `price_per_day × days × multiplier` no servidor e valida `people <= capacity`. Valor enviado pelo cliente é ignorado. Trava de flood: 5 pedidos por e-mail por hora.

**`published` fica fora do grant de colunas.** `revoke update on guides from authenticated` seguido de `grant update (name, email, phone, languages, region, group_limit, bio, photo_url)`. Admin também é `authenticated`, então publicar passa pelo RPC `set_guide_published()`, que verifica `is_platform_admin()`. Sem isso, curadoria seria só um combinado da interface. **Coluna nova em `guides` precisa ser adicionada a esse grant**, senão o painel não grava.

**`platform_admins` tem RLS ligada e zero policies.** Nenhum cliente lê ou escreve. Só `is_platform_admin()`, que é `SECURITY DEFINER`.

**Storage:** a policy exige que a primeira pasta do caminho seja o `uid` de quem envia (`{uid}/...`). Sem isso, um anfitrião sobrescreveria a foto de outro escolhendo o nome do arquivo.

**Slug nunca é regerado.** O trigger só gera quando está nulo — link já compartilhado não pode quebrar quando alguém edita o nome.

### Cadastro é por convite

Não existe trigger criando perfil no signup. A linha em `guides` nasce só do RPC `redeem_guide_invite`.

Fluxo: admin gera link em `/painel/admin` → `/painel/entrar?convite=TOKEN` → o token vai para `localStorage` → pessoa faz login (magic link ou Google) → o middleware resgata. O token fica em `localStorage` porque o login por Google sai da página e volta sem os parâmetros da URL.

**Mantenha "Allow new users to sign up" ligado no Supabase.** O convidado precisa criar a conta para depois resgatar o convite.

Primeiro admin foi inserido à mão:
```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = '...';
```

## Fotos e licenças

Fotos do Commons (busca em `/painel/roteiros`) vêm sob CC BY-SA / CC BY / FAL, que **obrigam atribuição**. Por isso `gallery` guarda `{label, image, credit, license, source}` e a página pública precisa exibir o crédito.

As nove fotos hardcoded em `pages/index.vue` hoje são usadas **sem crédito** — pendência real, resolvida quando o público for reescrito. Os créditos corretos estão em `supabase/seed/perfil-teste.sql`.

Busque por ponto turístico, não por cidade: "Foz do Iguaçu" devolve posto de gasolina e ônibus urbano; "Itaipu Dam" e "Iguazu Falls" devolvem as fotos certas.

A API do Commons aceita `origin=*`, então a busca roda no navegador. Sem servidor, sem chave, sem custo. Geração de imagem por IA foi descartada: erra lugares reais e identificáveis, o que encosta em publicidade enganosa.

## E-mail

`supabase/functions/notify-guide/index.ts` envia dois e-mails por solicitação:
ao **anfitrião** (novo pedido, com contato do cliente) e ao **cliente**
(confirmação de recebimento). Cada um tem carimbo próprio — `notified_at` e
`client_notified_at` — porque falham de forma independente; com um carimbo só,
uma falha no segundo geraria reenvio duplicado do primeiro.

Envia por **SMTP genérico**, configurado por variáveis de ambiente, não pela
API do Resend — o Resend exige domínio próprio verificado e ainda não temos
domínio. Trocar de provedor é trocar variáveis, não código.

Provedores que aceitam remetente sem domínio próprio:

| Provedor | Host | Porta | Observação |
|---|---|---|---|
| Brevo | `smtp-relay.brevo.com` | 587 | verifica um e-mail avulso; 300/dia grátis |
| Gmail | `smtp.gmail.com` | 465 | exige 2FA e senha de app |
| Mailjet | `in-v3.mailjet.com` | 587 | verifica remetente avulso |

Remetente: `personaltravel1br@gmail.com`. A tentativa de usar SMTP do Gmail
travou numa parede de verificação de identidade do Google — conta nova pedindo
código para um telefone que não é o do titular. Por isso a função ficou
agnóstica.

Em provedores de relay o usuário de login **não** é o remetente: por isso
existem `SMTP_USER` e `MAIL_FROM` separados.

O remetente do e-mail ao anfitrião usa nome exibido composto —
`Marina Costa (via PersonalTravel) <personaltravel1br@gmail.com>` — porque só
podemos assinar mensagens do endereço que controlamos. `replyTo` aponta para o
cliente, então responder tira a plataforma do meio.

Uma conexão SMTP por rodada, não por mensagem: o Gmail estrangula a conta com
excesso de handshakes.

Ativar:
```bash
npx supabase functions deploy notify-guide
npx supabase secrets set SMTP_HOST=smtp-relay.brevo.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USER=<login do provedor>
npx supabase secrets set SMTP_PASSWORD=<senha do provedor>
npx supabase secrets set MAIL_FROM=personaltravel1br@gmail.com
```
E no SQL Editor, uma vez: `select vault.create_secret('<service_role>', 'project_service_role_key');`
— é com ele que o pg_cron se autentica na função.

Quando houver domínio próprio, migrar para Resend ou para envio pelo próprio
domínio é trocar variáveis, não reescrever a função.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `pages/index.vue` | site público — **ainda hardcoded, sem banco** |
| `pages/painel/index.vue` | solicitações reais, métricas, troca de status |
| `pages/painel/roteiros.vue` | CRUD de roteiros, upload, busca no Commons |
| `pages/painel/perfil.vue` | perfil do anfitrião, upload de foto |
| `pages/painel/admin.vue` | convites, publicar anfitriões, ver tudo |
| `pages/painel/entrar.vue` | login e resgate de convite |
| `composables/useSupabase.ts` | cliente guardado no `nuxtApp`, não em variável de módulo |
| `composables/useAuth.ts` | sessão, papéis, convite |
| `composables/useImageUpload.ts` | upload para o bucket |
| `composables/useCommonsSearch.ts` | busca no Wikimedia |
| `middleware/auth.ts` | exige sessão e perfil ou admin |
| `middleware/admin.ts` | exige admin |

Middleware é conveniência de navegação. A barreira real é RLS.

`supabase/seed/perfil-teste.sql` põe os dados da Marcia e os três roteiros na conta `tanaportaria@gmail.com`. É massa de teste, fora de `migrations/` de propósito — migração é replayada para sempre, e dado pessoal ali dentro foi erro já cometido e desfeito. A Marcia terá conta própria via convite; o arquivo tem o `delete` de limpeza no fim.

## Desenvolvimento

`pnpm` não está no PATH. Use `corepack`:

```bash
corepack pnpm dev
corepack pnpm generate
```

Antes de publicar, rode `corepack pnpm generate`. Deve prerenderizar `/`, `/painel`, `/painel/entrar`, `/painel/perfil`, `/painel/admin`, `/painel/roteiros` e gerar o service worker.

### Armadilhas conhecidas

**Duas contas Supabase na mesma máquina.** Rode `npx supabase projects list` antes de qualquer comando que escreve. Já aconteceu de comando ir para o projeto errado.

**`supabase/.temp/linked-project.json` guarda o vínculo.** Se `link` falhar com `AlreadyExists`, apague `supabase/.temp/` — o conteúdo pode estar apontando para outro projeto.

**Comandos de leitura do CLI falham nesta conta:** `migration list`, `db query --linked` e `db advisors` retornam 403 `LegacyDbConfigLoginRoleStatusError`. `db push` funciona. Para verificar o banco, use o SQL Editor do dashboard.

**MCP do Supabase não está autorizado.** Precisa de `/mcp` em sessão interativa.

**Diagnósticos do IDE mentem depois de criar composable ou middleware.** `Cannot find name 'ref'`, `useAuth`, `definePageMeta` são auto-imports do Nuxt; os tipos em `.nuxt/` ficam velhos. Confirme com build antes de acreditar. Erro real recente: cast TypeScript dentro de expressão de template (`$event.target as HTMLSelectElement`) — não é permitido, passe o evento para a função.

**O projeto vive dentro do OneDrive**, que às vezes segura handles e recria pastas recém-apagadas.

**Tradução automática do navegador quebra o dashboard do Supabase.** Campos de confirmação comparam com o texto original em inglês, então o botão nunca libera. Desligue a tradução ao trabalhar lá.

## Guardrails

- Não apresente transporte como incluso enquanto o produto não o oferecer
- Não faça parecer que uma solicitação é reserva confirmada
- Preserve o telefone como campo de contato do cliente
- Textos em português brasileiro
- Não use "guia" para se referir aos cadastrados
- Não exiba foto do Commons sem crédito ao autor
- Chave secreta ou `service_role` nunca em arquivo do projeto nem em conversa

## Design

Verde profundo, cinza `#cfd8dc`, verde-lima de ação, coral de destaque. Botão lima tem texto escuro `#16201b`. Cabeçalho público fixo e opaco. Em tela pequena, o público usa menu de três linhas e o painel troca a barra lateral por cabeçalho recolhível. Tema claro/escuro em `composables/useTheme.ts`, restaurado só após hidratação.

Atenção: `.profile-photo` em `assets/css/main.css` define `height` mas não `width`. Já quebrou uma vez ao virar `<button>`.

## Graphify

```bash
graphify update .
graphify query "<pergunta>"
```

Mapa em `graphify-out/`. Use antes de responder sobre arquitetura.

# ProGuia

> PWA de roteiros privados pela Tríplice Fronteira. O cliente escolhe uma inspiração de roteiro, informa dias e tamanho do grupo e envia uma solicitação para a guia.

## Objetivo atual

O projeto é um protótipo funcional de uma operação inicialmente conduzida por uma única guia: **Marcia Marianno Machado**. A estrutura deve permitir uma evolução futura para uma plataforma em que outros guias tenham seu próprio painel, perfil e roteiros.

No estágio atual, não há transporte incluso, autenticação, banco de dados, envio real de e-mail nem comunicação interna. Os dados e as solicitações demonstrados no painel são exemplos locais.

## Experiência do cliente

Fluxo principal:

1. Acessar a página inicial e conhecer a guia.
2. Escolher uma inspiração de roteiro e consultar sua galeria de fotos.
3. Informar data, quantidade de dias e pessoas do grupo.
4. Escolher um pacote (Essencial, Conforto ou Completo).
5. Informar nome, e-mail e telefone para contato.
6. Concluir a solicitação.

Os roteiros não são pacotes rígidos: funcionam como ponto de partida para uma proposta personalizada pela guia. O preço é apresentado por dia e por grupo, com limite de pessoas por roteiro.

## Rotas e telas

| Rota | Finalidade |
| --- | --- |
| `/` | Site público, roteiros, galeria, fluxo de solicitação e apresentação da Marcia. |
| `/painel` | Visão geral do painel da guia, métricas e solicitações de exemplo. |
| `/painel/perfil` | Formulário local para dados públicos e de contato da guia. |

**Importante:** a página inicial do painel fica em `pages/painel/index.vue`, e não em `pages/painel.vue`. Essa estrutura mantém `/painel` e `/painel/perfil` como rotas independentes no Nuxt. Não recrie `pages/painel.vue` sem implementar a hierarquia com `<NuxtPage />`.

## Arquitetura

- **Framework:** Nuxt 3 + Vue 3 + TypeScript.
- **Estilo:** CSS próprio em `assets/css/main.css`; não há Tailwind ou biblioteca de componentes.
- **PWA:** `@vite-pwa/nuxt`, com manifesto, service worker e ícones em `public/images/`.
- **Geração:** saída estática via `nuxt generate`, adequada para Vercel.
- **Tema:** claro/escuro em `composables/useTheme.ts`. A preferência é restaurada apenas após a hidratação para evitar divergência entre HTML estático e o navegador.
- **Fotos:** imagem da guia em `public/images/marcia-marianno-machado.jpg`; fotos dos roteiros vêm do Wikimedia Commons.

Arquivos mais relevantes:

| Arquivo | Responsabilidade |
| --- | --- |
| `pages/index.vue` | Dados dos roteiros e fluxo completo de solicitação. |
| `pages/painel/index.vue` | Dashboard administrativo de demonstração. |
| `pages/painel/perfil.vue` | Dados editáveis da guia, ainda sem persistência. |
| `components/RouteCard.vue` | Card de cada inspiração de roteiro. |
| `components/RouteGallery.vue` | Galeria de fotos do roteiro. |
| `components/ThemeToggle.vue` | Controle de modo claro/escuro. |
| `components/PwaInstallPrompt.vue` | Convite para instalar o PWA. |
| `nuxt.config.ts` | Configuração Nuxt e PWA. |

## Design e responsividade

- Identidade visual: verde profundo, cinza suave `#cfd8dc`, verde-lima de ação e coral para destaque.
- Botões de fundo lima devem manter texto escuro (`#16201b`) para contraste.
- O cabeçalho público é fixo e opaco.
- Em telas pequenas, o site público usa menu de três linhas; o painel troca a barra lateral por cabeçalho compacto e menu recolhível.
- Preserve a distinção visual entre a área pública e o painel administrativo, mas mantenha os dois temas funcionando em claro e escuro.

## Desenvolvimento e validação

```bash
pnpm dev
pnpm generate
pnpm preview
```

Antes de publicar mudanças, execute `pnpm generate`. O build deve gerar as rotas `/`, `/painel` e `/painel/perfil`, além do service worker PWA.

## Deploy

- Repositório: `fred512/proguia` no GitHub.
- Hospedagem: Vercel, com deploy automático a partir da branch `main`.
- Após mudanças em PWA, uma versão antiga pode permanecer em cache; em testes, use recarregamento forçado (`Ctrl + F5`) se necessário.

## Próximos passos de produto

1. Definir o canal oficial de comunicação das solicitações antes de implementar e-mail, WhatsApp ou mensagens internas.
2. Persistir perfil da guia, roteiros, galerias e solicitações em backend.
3. Criar autenticação e isolamento de dados para vários guias.
4. Transformar o painel em uma operação real, com gestão de disponibilidade, limites e respostas às solicitações.

## Guardrails para mudanças

- Não apresente transporte como incluso enquanto o produto não o oferecer.
- Não faça parecer que uma solicitação é reserva confirmada.
- Não conecte envio de e-mail, WhatsApp, pagamentos ou banco de dados sem decisão explícita sobre o fluxo e as credenciais.
- Preserve o telefone como campo de contato do cliente e os dados de contato da guia no painel.
- Mantenha textos em português brasileiro e o nome completo **Marcia Marianno Machado**.

## Graphify

O mapa de conhecimento do projeto fica em `graphify-out/`:

- `graph.html`: visualização interativa.
- `GRAPH_REPORT.md`: relatório e auditoria do grafo.
- `graph.json`: dados do grafo para consultas.

Após alterações estruturais, atualize o mapa com:

```bash
graphify update .
```

Use o mapa antes de responder questões sobre arquitetura ou relações entre arquivos:

```bash
graphify query "Como funciona o fluxo de solicitação?"
```

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

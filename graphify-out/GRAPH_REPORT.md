# Graph Report - ProGuia  (2026-08-02)

## Corpus Check
- 35 files · ~19,897 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 220 nodes · 206 edges · 25 communities (17 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `129f2acd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pages/index.vue
- scripts
- roteiros.vue
- PwaInstallPrompt.vue
- perfil.vue
- ProGuia Brand Logo
- admin.vue
- RouteCard.vue
- painel/index.vue
- useTheme.ts
- app.vue
- ThemeToggle.vue
- PNPM Build Permissions
- Marcia Marianno Machado Guide Portrait
- PersonalTravel
- entrar.vue
- useCommonsSearch.ts
- useImageUpload.ts

## God Nodes (most connected - your core abstractions)
1. `PersonalTravel` - 12 edges
2. `scripts` - 7 edges
3. `ProGuia Brand Logo` - 5 edges
4. `resetDraft()` - 4 edges
5. `saveRoute()` - 4 edges
6. `closeMobileMenu()` - 3 edges
7. `load()` - 3 edges
8. `removeRoute()` - 3 edges
9. `Banco` - 3 edges
10. `TravelRoute` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Apple Touch App Icon` --semantically_similar_to--> `ProGuia Brand Logo`  [INFERRED] [semantically similar]
  public/images/apple-touch-icon-180x180.png → public/images/proguia-logo.svg
- `Maskable App Icon` --semantically_similar_to--> `ProGuia Brand Logo`  [INFERRED] [semantically similar]
  public/images/maskable-icon-512x512.png → public/images/proguia-logo.svg
- `PWA 192 App Icon` --semantically_similar_to--> `ProGuia Brand Logo`  [INFERRED] [semantically similar]
  public/images/pwa-192x192.png → public/images/proguia-logo.svg
- `PWA 512 App Icon` --semantically_similar_to--> `ProGuia Brand Logo`  [INFERRED] [semantically similar]
  public/images/pwa-512x512.png → public/images/proguia-logo.svg
- `PWA 64 App Icon` --semantically_similar_to--> `ProGuia Brand Logo`  [INFERRED] [semantically similar]
  public/images/pwa-64x64.png → public/images/proguia-logo.svg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **ProGuia Application Icon Variants** — public_images_apple_touch_icon_180x180_app_icon, public_images_maskable_icon_512x512_app_icon, public_images_pwa_192x192_app_icon, public_images_pwa_512x512_app_icon, public_images_pwa_64x64_app_icon, public_images_proguia_logo_brand_logo [INFERRED 0.85]

## Communities (25 total, 8 thin omitted)

### Community 0 - "pages/index.vue"
Cohesion: 0.12
Nodes (13): booking, bookingOpen, bookingStep, closeMobileMenu(), galleryRoute, mobileMenuOpen, packageMultiplier, perDay (+5 more)

### Community 1 - "scripts"
Cohesion: 0.09
Nodes (22): nuxt, dependencies, nuxt, @supabase/supabase-js, vue, devDependencies, @vite-pwa/assets-generator, @vite-pwa/nuxt (+14 more)

### Community 2 - "roteiros.vue"
Cohesion: 0.07
Nodes (24): CommonsImage, blank(), commonsOpen, commonsTerm, coverInput, draft, editing, errorMessage (+16 more)

### Community 4 - "perfil.vue"
Cohesion: 0.10
Nodes (13): ACCEPTED_TYPES, errorMessage, initials, loading, menuOpen, photoInput, profile, published (+5 more)

### Community 5 - "ProGuia Brand Logo"
Cohesion: 0.33
Nodes (6): Apple Touch App Icon, Maskable App Icon, ProGuia Brand Logo, PWA 192 App Icon, PWA 512 App Icon, PWA 64 App Icon

### Community 6 - "admin.vue"
Cohesion: 0.07
Nodes (21): copied, createInvite(), creatingInvite, errorMessage, GuideRow, guides, inviteEmail, inviteNote (+13 more)

### Community 8 - "painel/index.vue"
Cohesion: 0.10
Nodes (14): errorMessage, greeting, hostName, loading, menuOpen, newCount, openTotal, published (+6 more)

### Community 16 - "PersonalTravel"
Cohesion: 0.11
Nodes (17): Armadilhas conhecidas, Arquivos, Banco, Cadastro é por convite, Decisões de segurança que não devem ser desfeitas, Desenvolvimento, Design, E-mail (escrito, não ativado) (+9 more)

### Community 17 - "entrar.vue"
Cohesion: 0.17
Nodes (9): email, errorMessage, inviteToken, noInvite, redirecting, route, sending, sent (+1 more)

### Community 18 - "useCommonsSearch.ts"
Cohesion: 0.67
Nodes (3): COMMONS_SUGGESTIONS, stripHtml(), useCommonsSearch()

## Knowledge Gaps
- **124 isolated node(s):** `{ isDark }`, `{ $pwa }`, `dismissed`, `{ isDark, toggleTheme }`, `COMMONS_SUGGESTIONS` (+119 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CommonsImage` connect `roteiros.vue` to `useCommonsSearch.ts`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `ProGuia Brand Logo` (e.g. with `Apple Touch App Icon` and `Maskable App Icon`) actually correct?**
  _`ProGuia Brand Logo` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ isDark }`, `{ $pwa }`, `dismissed` to the rest of the system?**
  _124 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `pages/index.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `roteiros.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.06554621848739496 - nodes in this community are weakly interconnected._
- **Should `perfil.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
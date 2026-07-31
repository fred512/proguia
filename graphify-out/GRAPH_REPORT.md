# Graph Report - C:\Users\fredb\OneDrive\Documentos\Projetos\ProGuia  (2026-07-30)

## Corpus Check
- Corpus is ~8,698 words - fits in a single context window. You may not need a graph.

## Summary
- 77 nodes · 66 edges · 16 communities (8 shown, 8 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Public Booking Flow
- Application Dependencies
- Package Scripts
- PWA Installation
- Guide Profile Editor
- Brand and PWA Icons
- PWA Tooling
- Route Cards and Gallery
- Guide Dashboard
- Theme State
- App Shell
- Theme Toggle
- PNPM Build Permissions
- Guide Portrait

## God Nodes (most connected - your core abstractions)
1. `scripts` - 7 edges
2. `ProGuia Brand Logo` - 5 edges
3. `closeMobileMenu()` - 3 edges
4. `TravelRoute` - 2 edges
5. `nuxt` - 2 edges
6. `vue` - 2 edges
7. `@vite-pwa/assets-generator` - 2 edges
8. `@vite-pwa/nuxt` - 2 edges
9. `scrollToRoutes()` - 2 edges
10. `scrollToGuide()` - 2 edges

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

## Communities (16 total, 8 thin omitted)

### Community 0 - "Public Booking Flow"
Cohesion: 0.12
Nodes (13): booking, bookingOpen, bookingStep, closeMobileMenu(), galleryRoute, mobileMenuOpen, packageMultiplier, perDay (+5 more)

### Community 1 - "Application Dependencies"
Cohesion: 0.22
Nodes (8): nuxt, dependencies, nuxt, vue, name, private, type, vue

### Community 2 - "Package Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, generate, generate:pwa-assets, postinstall, preview

### Community 4 - "Guide Profile Editor"
Cohesion: 0.33
Nodes (3): menuOpen, profile, saved

### Community 5 - "Brand and PWA Icons"
Cohesion: 0.33
Nodes (6): Apple Touch App Icon, Maskable App Icon, ProGuia Brand Logo, PWA 192 App Icon, PWA 512 App Icon, PWA 64 App Icon

### Community 6 - "PWA Tooling"
Cohesion: 0.40
Nodes (5): devDependencies, @vite-pwa/assets-generator, @vite-pwa/nuxt, @vite-pwa/assets-generator, @vite-pwa/nuxt

## Knowledge Gaps
- **40 isolated node(s):** `{ isDark }`, `{ $pwa }`, `dismissed`, `{ isDark, toggleTheme }`, `ThemeName` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `Package Scripts` to `Application Dependencies`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `PWA Tooling` to `Application Dependencies`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `ProGuia Brand Logo` (e.g. with `Apple Touch App Icon` and `Maskable App Icon`) actually correct?**
  _`ProGuia Brand Logo` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ isDark }`, `{ $pwa }`, `dismissed` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Public Booking Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
# SciencePedia — Development Lifecycle

Two loops run in parallel once the foundation exists: **platform** (build the app) and **content** (fill the library). Optimized for a small team: few phases, hard exit criteria, no ceremony.

## Phase 0 — Foundation (one pass, do not rush it)

The one-way doors. Everything after this inherits these decisions.

| Owner | Deliverable |
|---|---|
| `knowledge-architect` | Taxonomy v1, entity + relationship model, learning graph rules |
| `seo-expert` | URL architecture, canonical policy, JSON-LD templates |
| `backend-architect` | Schema, RLS matrix, auth, search indexes, CI/CD, environments |
| `product-designer` | Page types + content contracts, tokens, component base |
| `science-editor` | Editorial standards, source hierarchy, sensitive-domain policy |
| `frontend-engineer` | App Router structure, rendering + caching strategy, budgets |

**Exit:** URL structure and taxonomy frozen and versioned · one article page rendering statically from real Supabase data with valid JSON-LD · RLS on every table with a passing denial test · CI running types, lint, axe, Lighthouse.

> Getting Phase 0 wrong is the only truly expensive mistake. Retrofitting a taxonomy or URL scheme onto 50,000 published articles costs more than everything else combined.

## Phase 1 — Vertical slice (one cluster, end to end)

Prove the whole machine on a single pillar, e.g. *Astronomy → The Solar System*, ~20 articles.

1. `knowledge-architect` models the cluster's entities and edges.
2. `seo-expert` writes the hub brief + 20 article briefs.
3. `content-curator` runs all 20 through the 11-step chain.
4. `frontend-engineer` builds Hub, Article, Category, Search.
5. `backend-architect` wires publish → revalidate.

**Exit:** the cluster fully published, interlinked, indexed, Core Web Vitals good, zero orphans, the five E2E journeys green.

## Phase 2 — Scale

- `backend-architect`: batch ingestion, materialized read models, partitioned logs, cost alerts.
- `frontend-engineer`: `generateStaticParams` for the top tier + ISR for the long tail, budgets enforced in CI.
- `content-curator`: batch generation, weekly library-health audit.
- `knowledge-architect`: keep the graph ahead of generation — **always**.

**Exit:** publish-to-live under 60s with no full rebuild · article TTFB <200ms p75 · batch defect rate falling.

## Phase 3 — Expand

Locales (`translation`), new clusters by demand, retention surfaces and learning paths. Same chain, same gates, higher volume.

## Phase 4 — Operate (forever)

| Activity | Owner | Cadence |
|---|---|---|
| Library health audit | `content-curator` | Weekly |
| Search Console + decay review | `seo-expert` | Weekly |
| Freshness re-verification | `science-editor` + `fact-check` | Quarterly per tier |
| Reader error triage | `science-editor` | <48h to correction |
| Graph integrity check | `knowledge-architect` | On every change + weekly |
| Perf, cost, security review | `backend-architect` + `frontend-engineer` | Weekly |

## The three gates

Every change passes all three. Parallel, not sequential.

| Gate | Owner | Checks |
|---|---|---|
| **Accuracy** | `science-editor` | Claims sourced, citations resolve and support, hedging preserved, reviewer assigned |
| **Technical** | `frontend-engineer` + `backend-architect` | Types, tests, axe clean, budgets, RLS, no secrets, reversible deploy |
| **SEO** | `seo-expert` | Unique title/description, canonical, valid JSON-LD, heading order, ≥3 internal links, in sitemap, server-rendered |

Bypass requires an explicit recorded human decision. **The accuracy gate has no bypass.**

## Definition of done

**Any change:**
- [ ] Meets the spec in every defined state; works at 390/768/1280px, both themes
- [ ] axe clean, keyboard operable
- [ ] Within JS budget, no CLS regression
- [ ] Types + lint + tests green; E2E journeys still passing
- [ ] RLS tested if it touches data; no secrets in client code
- [ ] Deployed and reversible in under five minutes

**An article, additionally:**
- [ ] All 11 chain steps completed in order
- [ ] Every substantive claim traced to a verified source
- [ ] One entity, typed edges, one primary category, ≥3 internal links
- [ ] Figure with verified licence, or a recorded reason there is none
- [ ] Reviewer, review date and last-verified visible on the page
- [ ] Indexed with valid JSON-LD, present in the sitemap

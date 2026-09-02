# SciencePedia — Development Lifecycle

The lifecycle has two halves that run concurrently once the platform exists:

- **Platform lifecycle** — building and evolving the Next.js 15 / Supabase / Vercel application.
- **Content lifecycle** — producing, verifying, publishing, translating and maintaining encyclopedia articles.

Both are governed by `project-orchestrator` and gated by the same non-negotiable quality bar.

---

## Phase 0 — Foundation (before any feature work)

**Goal:** decide the things that are expensive to change later.

| Owner | Deliverable |
|---|---|
| `product-manager` | Vision, non-goals, reader segments, north-star metric |
| `content-architect` | Discipline taxonomy v1, entity model, content templates |
| `science-editor` | Editorial standards, source hierarchy, sensitive-domain policy |
| `seo-expert` | URL architecture, canonical policy, schema templates, cluster model |
| `backend-architect` | Data model, content lifecycle state machine, RLS policy matrix |
| `database-architect` | Physical schema, index plan, capacity model |
| `frontend-architect` | App Router structure, rendering and caching strategy, budgets |
| `ui-designer` + `design-system-architect` | Visual language, token architecture, base components |
| `ux-designer` | Accessibility standard, navigation and search UX specs |
| `security-engineer` | Threat model, secrets policy, CSP and headers |
| `devops-engineer` | Environments, CI/CD skeleton, monitoring baseline |

**Exit criteria (all required):**
- URL structure and taxonomy frozen and versioned — these are one-way doors.
- One article page renders end to end from real Supabase data, statically generated, with valid JSON-LD.
- CI runs type check, lint, unit tests, axe scan and Lighthouse budgets.
- Every table has RLS enabled with a passing adversarial test.

> Getting Phase 0 wrong is the most expensive failure available. Retrofitting a taxonomy or URL scheme onto 50,000 published articles costs more than everything else combined.

---

## Phase 1 — Vertical slice (one topic cluster, end to end)

Prove the whole machine on a single pillar, for example *Astronomy → The Solar System*.

1. `content-architect` defines the cluster's entities and relationships.
2. `seo-expert` writes briefs for the pillar hub plus 15–25 cluster articles.
3. `ai-content-generator` drafts with retrieval and full provenance.
4. `fact-checker` verifies claim by claim.
5. `science-editor` approves, returns or rejects each one.
6. `frontend-engineer` builds the Hub, Article, Category and Search page types.
7. `playwright-test-engineer` covers the critical journeys end to end.
8. `qa-engineer` runs acceptance; `devops-engineer` deploys.
9. `data-analyst` verifies instrumentation and sets baselines.

**Exit criteria:** the cluster is fully published, internally linked, indexed, passing all gates, with zero orphan pages and Core Web Vitals in the "Good" band.

---

## Phase 2 — Scale the platform

The pattern is proven; now make it hold at volume.

- `frontend-architect`: `generateStaticParams` partitioning, ISR for the long tail, build-time budget at 100k+ pages.
- `database-architect`: materialized read models, full-text and vector indexes, keyset pagination, partitioned logs.
- `backend-architect`: batch ingestion pipeline, revalidation webhooks, idempotent generation jobs.
- `performance-engineer`: budgets enforced in CI; image and font pipelines finalized.
- `devops-engineer`: scheduled generation jobs, queue monitoring, cost alerting.
- `security-engineer`: rate limiting, bot management, audit logging on content mutation.

**Exit criteria:** publishing an article makes it live and correctly linked within 60 seconds with no full rebuild; article TTFB under 200ms at p75.

---

## Phase 3 — Content scale-up

Content production becomes the primary activity; engineering shifts to support.

- `growth-expert` + `seo-expert` sequence cluster expansion by demand, difficulty and mission fit.
- `content-architect` keeps taxonomy and coverage ahead of generation — **structure always precedes volume**.
- `ai-content-generator` produces in batches; `fact-checker` audits every draft plus a continuous sample of published content.
- `science-editor` calibrates prompts from observed error patterns rather than fixing articles one at a time.
- `data-analyst` feeds zero-result queries and gap analysis back into the topic queue.

**Guardrail:** if the `fact-checker` S1 rate in a batch exceeds threshold, generation halts until the prompt is fixed. Volume never overrides the accuracy gate.

---

## Phase 4 — Internationalization

- `localization-expert` selects locales by underserved demand, not raw speaker count.
- `backend-architect` models translations against language-independent concepts.
- `seo-expert` implements complete, reciprocal hreflang and per-locale sitemaps.
- `ui-designer` and `design-system-architect` verify +35% text expansion and RTL via logical properties.
- `science-editor` applies the same accuracy veto to every translation.

**Exit criteria per locale:** core tier fully translated and domain-reviewed, hreflang complete, RTL verified with embedded formulas, zero cross-language cannibalization.

---

## Phase 5 — Growth and optimization

- `growth-expert`: cluster completion, retention surfaces, learning paths, earned-link assets.
- `data-analyst`: experiments with pre-registered metrics and guardrails.
- `seo-expert`: cannibalization audits, decay-driven refreshes, SERP feature targeting.
- `performance-engineer` + `devops-engineer`: cost per 1,000 sessions trending down.

---

## Phase 6 — Steady-state operations (continuous, forever)

| Activity | Owner | Cadence |
|---|---|---|
| Freshness re-verification | `fact-checker` -> `science-editor` | Quarterly per topic tier |
| Retraction and source-change watch | `fact-checker` | Continuous |
| Published-content audit sample (>=2%) | `fact-checker` | Monthly |
| Reader-reported error triage | `science-editor` | Correction within 48h |
| Dependency and vulnerability review | `security-engineer` | Weekly and on advisory |
| Core Web Vitals and cost review | `performance-engineer`, `devops-engineer` | Weekly |
| Index coverage and ranking review | `seo-expert` | Weekly |
| Restore drill | `devops-engineer` | Per cycle |
| Retrospective | `project-orchestrator` | Per release / incident |

---

## The per-change pipeline (applies in every phase)

```
Intake -> Classify -> Design -> Architect -> Implement -> Gate -> Release -> Measure -> Learn
   |         |          |          |             |          |         |          |        |
 orch.     orch.     PD/UX/UI   FE/BE/DB      FE eng    6 gates    devops    analyst   PM/orch
```

**The six release gates**, all required, run in parallel:

| Gate | Owner |
|---|---|
| Accuracy | `science-editor` (+ `fact-checker`) |
| Security | `security-engineer` |
| Accessibility | `ux-designer` |
| Performance | `performance-engineer` |
| SEO | `seo-expert` |
| Functional | `qa-engineer` + `playwright-test-engineer` |

A gate may be bypassed only by an explicit, recorded human decision. The accuracy gate has no bypass at all.

---

## Definition of Done

A change is done when **all** of the following hold:

- [ ] Meets the PRD acceptance criteria in every specified state
- [ ] Works at 390 / 768 / 1280 px in both light and dark themes
- [ ] axe clean, fully keyboard operable, correctly announced by a screen reader
- [ ] Within the route's JS and transfer budget; no CLS regression
- [ ] Unique title and description, canonical, valid JSON-LD, correct heading order, internal links in and out
- [ ] Security reviewed where it touches auth, user input or data; RLS tested
- [ ] Unit/component tests plus E2E coverage for the journey it affects
- [ ] Instrumented per `docs/analytics/events.md` and verified after deploy
- [ ] Documented: ADR for architectural decisions, catalog entry for new components
- [ ] Deployed, monitored, and measured against its declared metric

For content, additionally:

- [ ] Every substantive claim carries verified provenance
- [ ] Every citation resolves and genuinely supports its claim
- [ ] Named reviewer, review date and last-verified date shown on the page
- [ ] Correctly placed in the taxonomy with typed relationships and cluster links

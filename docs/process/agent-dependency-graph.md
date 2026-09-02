# SciencePedia — Agent Dependency Graph

`A -> B` means **B needs A's output**.

## 1. The graph

```
                       project-orchestrator
                              | routes everything
                              v
                      knowledge-architect
                    entities · relationships
                    taxonomy · learning graph
                              |
         +--------------------+--------------------+-------------------+
         |                    |                    |                   |
         v                    v                    v                   v
   content-curator       seo-expert         product-designer    backend-architect
   topic queue ->        clusters,          sitemap, nav,       tables for
   article chain         briefs, links      search, paths       entities + edges
         |                    |                    |                   |
         v                    |                    v                   |
   science-editor             |            frontend-engineer <---------+
   accuracy VETO              |            Next.js app          types + API contract
         |                    |                    |
         +--------------------+--------------------+
                              v
                           PUBLISH
                              |
                              v
                        seo-expert (measure)
                              |
                              +---> back to knowledge-architect (gaps)
                              +---> back to content-curator (decay, refresh)
```

Everything flows from `knowledge-architect`. That is the design: pages, clusters, categories, internal links and learning paths are all **projections of one graph**, not four hand-maintained lists that drift apart.

## 2. Dependency edges

```
knowledge-architect -> content-curator      topic queue, entity + template
knowledge-architect -> seo-expert           cluster skeleton
knowledge-architect -> product-designer      learning graph, navigation structure
knowledge-architect -> backend-architect     entity/relationship model to store

seo-expert          -> content-curator       content brief (starts every article)
seo-expert          -> frontend-engineer     metadata + JSON-LD spec, URL rules
seo-expert          -> product-designer      on-page requirements, heading rules

content-curator     -> science-editor        draft + source pack + claim map
science-editor      -> content-curator       verdict, error patterns
content-curator     -> backend-architect     revision to persist, publish state

product-designer    -> frontend-engineer     page spec, tokens, states, a11y
backend-architect   -> frontend-engineer     generated types, API contract, RLS behavior
frontend-engineer   -> backend-architect     query shapes the pages actually need

seo-expert          -> knowledge-architect   search demand -> coverage priority
content-curator     -> knowledge-architect   gaps, duplicates, orphans found in audit
```

## 3. Blocking edges

`A =X=> B` means A can stop B shipping.

```
science-editor      =X=> ALL              accuracy, absolute
backend-architect   =X=> all engineering  RLS, migrations, secrets
seo-expert          =X=> designer, frontend  URLs, rendering, schema
knowledge-architect =X=> content-curator  unmodeled branch
content-curator     =X=> publish          orphan, thin, duplicate, no provenance
frontend-engineer   =X=> own merges       budgets, a11y, tests
product-designer    =X=> scope only
project-orchestrator=X=> nothing          enforces others' blocks
```

## 4. Critical paths

**Content (11 hops, strictly serial):**
`knowledge-architect -> seo-expert(brief) -> content-research -> fact-check -> article-generator -> science-editor -> graph -> seo -> category -> images -> translation -> supabase -> content-curator -> publish`

**Platform (5 hops):**
`product-designer -> seo-expert(constraints) -> frontend-engineer <-> backend-architect -> gates -> ship`

**Model change (highest cost of error, 3 hops):**
`knowledge-architect -> backend-architect -> seo-expert (URL/cluster impact)`

### Parallel
`seo-expert` + `product-designer` + `backend-architect` after the graph is set · the three gates · steps 6–8 of the chain if the editor has already approved.

### Never parallel
- Research → fact-check → generate (each needs the previous finished)
- Taxonomy change vs. generation into that branch
- Migration vs. dependent code deploy (expand → deploy → migrate → contract)
- URL change vs. publishing (redirect map lands first)

## 5. Cycles and their breakers

| Cycle | Breaker |
|---|---|
| `knowledge-architect` ↔ `seo-expert` (structure vs. demand) | Demand sets priority, never structure. Architect rules on what a concept *is*; SEO rules on how it is presented. |
| `frontend-engineer` ↔ `backend-architect` (contract) | Write and version the API contract first; neither implements before it is agreed. |
| `content-curator` ↔ `science-editor` (revision loop) | Two rounds maximum, then the editor decides publish-or-drop. |
| `product-designer` ↔ `frontend-engineer` (feasibility) | Engineer states the cost; designer picks the alternative. No silent redesign in code. |

## 6. Bottlenecks

| Agent | Why | Mitigation |
|---|---|---|
| `science-editor` | Every article passes through, veto is absolute | `fact-check` pre-filters at step 2; review in batches; feed error patterns into the generator prompt so first-pass rate rises |
| `knowledge-architect` | Blocks all generation into unmodeled branches | Model a whole branch at once, ahead of the content queue |
| `project-orchestrator` | Everything routes through it | The routing table lets obvious cases self-route |

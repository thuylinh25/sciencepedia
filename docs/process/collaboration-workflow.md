# SciencePedia — Collaboration & Publishing Workflow

## 1. How the eight agents work together

```
                    project-orchestrator
                    (routes, sequences, rules)
                              |
        +---------------------+---------------------+
        |                     |                     |
  knowledge-architect   product-designer      seo-expert
   entities, taxonomy    sitemap, UX,         URLs, schema,
   learning graph        navigation, search   clusters, briefs
        |                     |                     |
        +----------+----------+----------+----------+
                   |                     |
            content-curator        frontend-engineer
            pipeline + library      Next.js app
            quality                 + performance
                   |                     |
            science-editor         backend-architect
            accuracy VETO           Supabase, RLS, ops
                   |                     |
                   +----------+----------+
                              |
                          PUBLISH
```

**Two loops run continuously:**
- **Content loop** — `knowledge-architect` → `content-curator` → `science-editor` → publish
- **Platform loop** — `product-designer` → `frontend-engineer` ↔ `backend-architect` → ship

`seo-expert` constrains both. `project-orchestrator` sequences both.

## 2. Publishing workflow — the canonical chain

Every article follows this exact sequence. Never skip a step, never reorder.

```
Topic Request
      |
      v
 1. content-research         gather + rank authoritative sources
      |                      -> content/research/<slug>.yaml
      v
 2. fact-check               validate the source pack BEFORE writing
      |                      -> pass / gap report
      v
 3. article-generator        draft from validated sources + brief
      |                      -> draft + claim map + uncertainty report
      v
 4. science-editor           approve / revise / reject      [VETO]
      |                      -> reviewer byline + review date
      v
 5. knowledge-graph-manager  entity + typed relationships
      |                      -> edges: is-a, part-of, prerequisite-of, ...
      v
 6. seo-optimizer            metadata, JSON-LD, canonical, internal links
      |                      -> 10-point pre-publish check
      v
 7. category-manager         primary + secondary taxonomy placement
      |                      -> breadcrumbs, hub linkage
      v
 8. image-finder             figures, licence verification, alt text
      |                      -> or a recorded no_figure reason
      v
 9. translation              locale variants + terminology enforcement
      |                      -> per-locale review, hreflang
      v
10. supabase-manager         write revision, citations, edges; set state
      |                      -> fire revalidation webhook
      v
11. content-curator          final quality check
      |                      -> orphan? thin? duplicate? provenance complete?
      v
   PUBLISH
```

### Why this order
- **Research before writing** (1→3): drafting from memory produces confident, wrong prose.
- **Fact-check before generation** (2→3): validating the evidence base is far cheaper than rewriting an article built on bad sources.
- **Editor before structure** (4→5): do not spend graph, SEO and image work on content that will be rejected.
- **Graph before SEO and categories** (5→6→7): internal links and placement are derived from the graph, not invented.
- **Storage last** (10): everything is assembled and verified before anything is persisted.
- **Curator final** (11): one agent owns "is the library still healthy after this".

### Revision loop
`science-editor` returns a draft → back to step 3 (rewrite) or step 1 (bad sources). **Two rounds maximum**, then the editor decides publish-or-drop. If the same defect appears three times in a batch, halt the batch and fix the prompt.

## 3. Feature workflow (platform work)

```
Request -> project-orchestrator
              |
              v
        product-designer      spec: page type, states, tokens, a11y
              |
        +-----+-----+
        v           v
   seo-expert   knowledge-architect     constraints: URL, schema, entities
        |           |
        +-----+-----+
              v
   frontend-engineer  <-->  backend-architect    contract agreed in writing first
              |
              v
        THREE GATES (parallel)
        accuracy    -> science-editor      (only if content surfaces change)
        technical   -> frontend-engineer + backend-architect
        SEO         -> seo-expert
              |
              v
           SHIP -> measure
```

## 4. Handoff rule

A handoff carries: **artifact path · what is done · what the receiver must decide · blockers**.

If the receiving agent finds a required input missing, it **returns the handoff** rather than guessing. Guessing is how specs get silently violated.

## 5. Conflict precedence

Highest wins. `project-orchestrator` applies it and records the ruling in `docs/process/decisions.md`.

```
1. Scientific accuracy      science-editor       (absolute, no override)
2. Security / data integrity backend-architect
3. SEO / indexability       seo-expert
4. Performance & a11y       frontend-engineer
5. Knowledge model          knowledge-architect
6. Design preference        product-designer
7. Convenience              nobody
```

Exception: `knowledge-architect` outranks `seo-expert` on **structure** (what a concept *is*); `seo-expert` outranks on **presentation** (URL, metadata, linking). Demand sets priority; it never sets structure.

## 6. Who can block what

| Agent | Blocks | On |
|---|---|---|
| `science-editor` | everything | accuracy — non-overridable |
| `backend-architect` | any merge | RLS missing, unsafe migration, secret exposure |
| `seo-expert` | design + frontend | URL change, non-indexable rendering, missing schema |
| `knowledge-architect` | any content batch | unmodeled branch, untyped relationships |
| `frontend-engineer` | own merges | budget breach, a11y failure, failing tests |
| `content-curator` | publish | orphan, thin, duplicate, incomplete provenance |
| `product-designer` | scope | out of scope |
| `project-orchestrator` | nothing | enforces others' blocks |

## 7. Escalate to the human only for

Editorial policy on contested domains · budget · legal and licensing · monetization · anything irreversible and public · a genuine deadlock between the top two precedence levels.

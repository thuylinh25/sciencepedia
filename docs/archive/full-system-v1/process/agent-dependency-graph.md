# SciencePedia — Agent Dependency Graph

Three views of the same system:

1. **Layered map** — where each agent sits.
2. **Directed dependency edges** — who needs whom, and for what.
3. **Blocking graph** — who can stop whom.

An edge `A -> B` means **B depends on A's output** (A must produce before B can proceed).

---

## 1. Layered map

```
                          +---------------------------+
   LAYER 0: CONTROL       |   project-orchestrator    |
                          +---------------------------+
                                      |
                                      v
                          +---------------------------+
   LAYER 1: STRATEGY      |     product-manager       |
                          +---------------------------+
                             |         |          |
              +--------------+         |          +---------------+
              v                        v                          v
   +--------------------+   +--------------------+   +--------------------+
   | content-architect  |   | product-designer   |   |    seo-expert      |
   +--------------------+   +--------------------+   +--------------------+
   LAYER 2: DEFINITION -- taxonomy, IA, search intent
              |                        |                          |
              v                        v                          v
   +--------------------+   +--------------------+   +--------------------+
   |  science-editor    |   |   ux-designer      |   |  growth-expert     |
   |  (accuracy law)    |   |   ui-designer      |   |                    |
   +--------------------+   +--------------------+   +--------------------+
              |                        |
              |                        v
              |             +---------------------------+
              |             | design-system-architect   |
              |             +---------------------------+
              |                        |
              v                        v
   +--------------------+   +---------------------------------------+
   | ai-content-gen     |   | frontend-architect   backend-architect|
   |     |              |   |         |            database-architect|
   |     v              |   +---------------------------------------+
   | fact-checker       |                   |
   |     |              |                   v
   |     v              |        +---------------------------+
   | science-editor     |        |    frontend-engineer      |
   |     |              |        +---------------------------+
   |     v              |                   |
   | localization-expert|                   |
   +--------------------+                   |
   LAYER 3: PRODUCTION                      |
              |                             |
              +--------------+--------------+
                             v
   +-------------------------------------------------------------+
   | LAYER 4: GATES                                              |
   | qa-engineer  playwright-test-engineer  performance-engineer |
   | security-engineer   ux-designer(a11y)   seo-expert(technical)|
   +-------------------------------------------------------------+
                             |
                             v
                  +---------------------------+
   LAYER 5: OPS   |     devops-engineer       |
                  +---------------------------+
                             |
                             v
   +-------------------------------------------------------------+
   | LAYER 6: FEEDBACK    data-analyst  +  growth-expert          |
   +-------------------------------------------------------------+
                             |
                             +--------> back to product-manager
                                        and content-architect
```

---

## 2. Dependency edges

`A -> B` = B consumes A's output.

### Strategy and definition
```
product-manager      -> product-designer        PRD, segments, constraints
product-manager      -> content-architect       coverage priorities
product-manager      -> seo-expert              topic targets, business goals
product-manager      -> data-analyst            metric definitions
product-manager      -> growth-expert           growth mandate and budget

content-architect    -> ai-content-generator    topic, entity type, template
content-architect    -> seo-expert              taxonomy = cluster skeleton
content-architect    -> product-designer        knowledge structure for IA
content-architect    -> backend-architect       entity/relationship model
content-architect    -> localization-expert     concepts, aliases, naming

seo-expert           -> ai-content-generator    content briefs
seo-expert           -> frontend-architect      URL rules, rendering constraints
seo-expert           -> frontend-engineer       metadata + JSON-LD spec
seo-expert           -> product-designer        on-page requirements
seo-expert           -> playwright-test-engineer SEO assertions
```

### Design chain
```
product-designer         -> ux-designer              flows to validate
product-designer         -> ui-designer              wireframes + state matrix
product-designer         -> design-system-architect  component needs
product-designer         -> frontend-engineer        implementation spec

ux-designer              -> ui-designer              contrast, targets, focus
ux-designer              -> design-system-architect  a11y contracts per component
ux-designer              -> playwright-test-engineer keyboard + SR scenarios

ui-designer              -> design-system-architect  token values
design-system-architect  -> frontend-engineer        components + tokens
design-system-architect  -> localization-expert      expansion/RTL capable components
```

### Platform chain
```
backend-architect    -> database-architect     domain model to realize physically
backend-architect    -> frontend-architect     API contract, generated types
backend-architect    -> ai-content-generator   ingestion + provenance APIs
backend-architect    -> security-engineer      auth flows and RLS to review

database-architect   -> backend-architect      feasible query shapes, read models
database-architect   -> frontend-architect     latency envelope per page type
database-architect   -> devops-engineer        migration + backup requirements

frontend-architect   -> frontend-engineer      route map, rendering, patterns
frontend-architect   -> design-system-architect server/client boundary
frontend-architect   -> performance-engineer   budgets to enforce
frontend-architect   -> devops-engineer        deployment + ISR requirements
```

### Content chain (strictly serial)
```
content-architect -> seo-expert -> ai-content-generator -> fact-checker
                  -> science-editor -> [PUBLISHED] -> localization-expert
science-editor    -> ai-content-generator   standards, style, error patterns
science-editor    -> fact-checker           thresholds, source hierarchy
fact-checker      -> ai-content-generator   claim-level rejection feedback
fact-checker      -> qa-engineer            automatable citation checks
```

### Gates and operations
```
frontend-engineer      -> qa-engineer                build to accept
frontend-engineer      -> playwright-test-engineer   selectors, semantics
qa-engineer            -> playwright-test-engineer   required coverage
qa-engineer            -> devops-engineer            release verdict
performance-engineer   -> devops-engineer            CDN/cache configuration
security-engineer      -> devops-engineer            secrets, isolation, alerts
devops-engineer        -> data-analyst               deployed instrumentation
```

### Feedback edges (the loop that closes the system)
```
data-analyst   -> product-manager      evidence for prioritize / kill
data-analyst   -> content-architect    gap reports from zero-result queries
data-analyst   -> seo-expert           query, CTR and ranking signals
data-analyst   -> ux-designer          behavioral usability evidence
data-analyst   -> growth-expert        funnel, cohort, retention data
growth-expert  -> product-manager      expansion proposals
growth-expert  -> seo-expert           cluster sequencing
growth-expert  -> localization-expert  locale priorities
```

---

## 3. Blocking graph (veto edges)

Distinct from dependency: `A =X=> B` means **A can stop B from shipping**.

```
science-editor      =X=>  ALL AGENTS                 accuracy (absolute, no override)
security-engineer   =X=>  ALL ENGINEERING + devops   High/Critical findings
ux-designer         =X=>  ui-designer, design-system-architect,
                          frontend-engineer, product-designer   WCAG 2.2 AA
fact-checker        =X=>  ai-content-generator       unverified claims
performance-engineer=X=>  frontend-engineer, design-system-architect  budget breach
seo-expert          =X=>  frontend-architect, frontend-engineer,
                          product-designer, ai-content-generator  crawl/index damage
qa-engineer         =X=>  devops-engineer (release)  S1/S2 defects
database-architect  =X=>  backend-architect          unsafe migration
design-system-arch. =X=>  frontend-engineer          off-system UI
frontend-architect  =X=>  frontend-engineer          undocumented deviation
product-manager     =X=>  all                        scope only
project-orchestrator=X=>  nothing directly           enforces others' vetoes
```

**Precedence when two vetoes collide** (highest first):

```
1. science-editor      (scientific accuracy)
2. security-engineer   (security)
3. ux-designer         (accessibility)
4. legal / privacy
5. performance-engineer
6. seo-expert
7. product-manager     (scope)
8. design preference
9. developer convenience
```

`project-orchestrator` applies this order, records the ruling in `docs/process/decisions.md`, and escalates to the human only on a genuine deadlock between the top tiers.

---

## 4. Critical paths

The longest serial chains — where delay propagates furthest.

**Content critical path (7 hops, no parallelism possible):**
```
content-architect -> seo-expert -> ai-content-generator -> fact-checker
  -> science-editor -> publish -> localization-expert
```

**Feature critical path (9 hops):**
```
product-manager -> product-designer -> ui-designer -> design-system-architect
  -> frontend-architect -> frontend-engineer -> gates -> qa-engineer -> devops-engineer
```

**Data-model critical path (5 hops, highest cost of error):**
```
content-architect -> backend-architect -> database-architect
  -> security-engineer (RLS) -> frontend-architect (contract)
```

### What can run in parallel

| Parallel group | Members |
|---|---|
| Definition | `content-architect`, `seo-expert`, `product-designer` (after the PRD) |
| Design review | `ux-designer`, `ui-designer` |
| Architecture | `frontend-architect`, `backend-architect`, `database-architect` |
| Release gates | all six gate owners |
| Feedback | `data-analyst`, `growth-expert` |

### What must never be parallelized

- `ai-content-generator` -> `fact-checker` -> `science-editor` (verification requires a finished draft)
- Taxonomy changes vs. content generation (structure precedes volume, always)
- Schema migration vs. dependent code deploy (expand -> deploy -> migrate -> contract)
- URL changes vs. publishing (redirect map lands first)

---

## 5. Cycle risks and their breakers

Genuine circular dependencies exist; each has a defined breaker.

| Cycle | Breaker |
|---|---|
| `ui-designer` <-> `design-system-architect` (values vs. structure) | Designer owns values, architect owns naming/structure. Architect rules on system questions. |
| `frontend-architect` <-> `backend-architect` (contract) | Write and version the API contract first; neither implements before it is signed. |
| `seo-expert` <-> `content-architect` (demand vs. structure) | Structure follows science; SEO adapts through internal linking. |
| `ai-content-generator` <-> `fact-checker` (revision loop) | Maximum two revision rounds, then `science-editor` decides. |
| `product-manager` <-> `data-analyst` (metric vs. evidence) | PM declares the metric before build; the analyst may not redefine it after the fact. |
| `performance-engineer` <-> `ui-designer` (budget vs. ambition) | Budget wins; performance proposes alternatives rather than refusing outright. |

---

## 6. Single points of failure

| Agent | Why it is a bottleneck | Mitigation |
|---|---|---|
| `science-editor` | Absolute veto on all content; every article passes through | Codify standards so `fact-checker` pre-filters; batch review; feed error patterns into prompts to raise first-pass rate |
| `content-architect` | Taxonomy blocks all generation | Freeze taxonomy per branch in Phase 0; version changes, never edit in place |
| `frontend-architect` | All implementation patterns flow from here | Reference implementations per route type so engineers self-serve |
| `project-orchestrator` | Every cross-agent request routes through it | Published routing table lets obvious cases self-route |

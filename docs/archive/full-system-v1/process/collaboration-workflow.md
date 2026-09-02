# SciencePedia — Recommended Collaboration Workflow

How the 23 agents in `.claude/agents/` work together. `project-orchestrator` is the default entry point for anything spanning more than one agent.

---

## 1. Core principles

1. **Single owner per task.** Reviewers are named separately. Shared ownership is treated as no ownership.
2. **Handoff contracts.** Work moves forward only when it satisfies the receiving agent's documented *Inputs*. The receiver may reject an incomplete handoff back to the sender.
3. **Gates are not negotiable.** Accuracy, security and accessibility gates cannot be traded for a date. Cut scope instead.
4. **Precedence order for conflicts** (highest wins):
   `science-editor` (accuracy) -> `security-engineer` -> `ux-designer` (accessibility) -> legal/privacy -> `performance-engineer` -> `seo-expert` -> `product-manager` (scope) -> design preference -> developer convenience.
5. **Right-size the process.** Match ceremony to blast radius (see section 6).
6. **Escalate after two rounds.** Two agents who cannot converge in two exchanges get a ruling from `project-orchestrator` by precedence, or the question goes to the human.

---

## 2. The four workstreams

Work flows through four largely parallel streams that converge at release.

| Stream | Agents | Produces |
|---|---|---|
| **Product & Design** | `product-manager` -> `product-designer` -> `ux-designer` -> `ui-designer` -> `design-system-architect` | PRDs, IA, flows, visual language, components |
| **Platform** | `frontend-architect` + `backend-architect` + `database-architect` -> `frontend-engineer` | Routes, schema, APIs, production code |
| **Content** | `content-architect` -> `seo-expert` -> `ai-content-generator` -> `fact-checker` -> `science-editor` -> `localization-expert` | Taxonomy, briefs, published articles, translations |
| **Quality & Ops** | `qa-engineer` + `playwright-test-engineer` + `performance-engineer` + `security-engineer` + `devops-engineer` | Gates, tests, deploys, monitoring |

`data-analyst` and `growth-expert` form the **feedback loop** that re-enters at `product-manager` and `content-architect`.

---

## 3. Standard feature workflow

```
Request
  |
  v
project-orchestrator ---- classify, decompose, sequence
  |
  v
product-manager --------- PRD: problem, segment, metrics, kill criteria
  |
  +--> content-architect -- entities, taxonomy fit, content contract
  +--> seo-expert --------- intent, URL, schema, internal-link plan
  |
  v
product-designer -------- IA, flows, page anatomy, full state matrix
  |
  +--> ux-designer -------- usability + accessibility review     [CAN BLOCK]
  +--> ui-designer -------- visual spec, both themes
         |
         v
design-system-architect -- tokens + components (build or reuse)
  |
  v
frontend-architect  <-->  backend-architect  <-->  database-architect
   route + rendering        API contract + RLS       schema + indexes
         |                        |
         +-----------+------------+
                     v
              frontend-engineer ---- implementation + unit/component tests
                     |
                     v
   +-----------------+--------------------------------+
   |  PARALLEL REVIEW GATES (all must pass)           |
   |  ux-designer .......... accessibility            |
   |  ui-designer .......... visual fidelity          |
   |  performance-engineer   budgets + Core Web Vitals|
   |  security-engineer .... threat + secrets + RLS   |
   |  seo-expert ........... metadata + JSON-LD       |
   |  playwright-test-eng .. E2E + a11y + SEO tests   |
   +-----------------+--------------------------------+
                     v
              qa-engineer ---------- acceptance + release readiness
                     |
                     v
              devops-engineer ------ preview -> promote -> monitor
                     |
                     v
              data-analyst --------- verify instrumentation, measure vs PRD metric
                     |
                     v
              product-manager ------ ship / iterate / kill
```

---

## 4. Content publishing workflow

The highest-volume workflow, and the one with the strictest gate.

```
content-architect ---- assigns topic, entity type, template, relationships
        |
        v
seo-expert ----------- content brief: intent, entities, sections, links, snippet target
        |
        v
ai-content-generator - RETRIEVE authoritative sources -> draft
                       + claim-to-source provenance
                       + uncertainty report
        |
        v
fact-checker --------- claim-by-claim verification            [HARD GATE]
        |               verdicts: verified / partially-supported /
        |               unsupported / contradicted / unverifiable / outdated
        |
        +-- any S1 (fabricated or misattributed) --> REJECT
        |       +--> audit the entire generation batch
        |       +--> generator revises the prompt, not just the article
        |
        v
science-editor ------- publish / revise / reject              [ABSOLUTE VETO]
        |               assigns reviewer byline + review date
        v
   PUBLISHED --------> backend-architect emits revalidation webhook
        |
        +--> localization-expert -- translate -> domain review -> publish per locale
        +--> seo-expert ---------- sitemap, internal links, cluster wiring
        +--> data-analyst -------- performance tracking, decay monitoring
                    |
                    v
             refresh / re-verify queue --> back to ai-content-generator
```

**Nothing publishes without passing `fact-checker` and being approved by `science-editor`.** No deadline, traffic goal or stakeholder request overrides this.

---

## 5. Recurring loops

| Loop | Cadence | Path |
|---|---|---|
| **Ship loop** | Continuous | orchestrator -> owner -> gates -> `qa-engineer` -> `devops-engineer` |
| **Content loop** | Continuous | `content-architect` -> `seo-expert` -> generator -> checker -> editor -> publish |
| **Measurement loop** | Weekly | `data-analyst` -> `product-manager` / `seo-expert` / `ux-designer` |
| **Growth loop** | Monthly | `growth-expert` + `data-analyst` -> `product-manager` -> expansion plan |
| **Freshness loop** | Quarterly per topic tier | `fact-checker` re-verification -> `science-editor` -> regenerate |
| **Health loop** | Weekly | `performance-engineer` + `security-engineer` + `devops-engineer` -> orchestrator |
| **Retrospective** | Per release / incident | `project-orchestrator` with the agents involved |

---

## 6. Right-sizing: how much process?

| Blast radius | Example | Process |
|---|---|---|
| **Trivial** | Typo, copy tweak | Owner + merge. No PRD. |
| **Small** | New component variant | Owner + one reviewer + CI gates |
| **Medium** | New page type, new API | Design + architecture review + full gates |
| **Large** | New language, auth system, schema change | Full lifecycle, ADR, threat model, staged rollout |
| **Content** | Any article | Always the full content gate - volume never lowers the bar |

---

## 7. Blocking authority - who can stop what

| Agent | Can block | On what grounds |
|---|---|---|
| `science-editor` | **Everything** | Scientific accuracy - absolute, non-overridable |
| `security-engineer` | Any merge or deploy | High/Critical security findings |
| `ux-designer` | Design, components, implementation | WCAG 2.2 AA violations (S1/S2) |
| `fact-checker` | Any article | Unverified or misattributed claims |
| `performance-engineer` | Any PR | Performance budget breach |
| `seo-expert` | URLs, rendering, metadata | Crawlability and indexation damage |
| `qa-engineer` | Any release | S1/S2 defects, failed gates |
| `database-architect` | Any migration | Unsafe locks, unjustified indexes, N+1 queries |
| `design-system-architect` | Any UI PR | Ad-hoc styling, off-system components |
| `frontend-architect` | Implementation | Deviation from architecture without an ADR |
| `product-manager` | Scope | Out-of-scope work |
| `project-orchestrator` | Nothing directly | Enforces others' blocks; escalates deadlocks |

---

## 8. Handoff contract format

Every handoff between agents carries:

```yaml
from: product-designer
to: frontend-engineer
artifact: docs/design/specs/article-page.md
inputs_satisfied:        # the receiver's documented Inputs
  - state_matrix: complete (empty/loading/error/overflow/RTL)
  - tokens: referenced by semantic name
  - a11y_annotations: attached
acceptance_criteria:
  - renders correctly at 390 / 768 / 1280 px in both themes
  - axe clean, fully keyboard operable
  - JSON-LD emitted per docs/seo/schema.md
blocked_by: []
reviewers: [ux-designer, ui-designer, seo-expert]
```

A receiving agent that finds `inputs_satisfied` incomplete **returns the handoff** rather than guessing. Guessing is how specs get silently violated.

---

## 9. Escalation to the human stakeholder

`project-orchestrator` escalates - and only for:

- Mission or editorial policy questions, especially contested scientific domains
- Budget and infrastructure cost decisions
- Legal, licensing, privacy and compliance
- Monetization
- Security incidents and public disclosures
- Genuine deadlocks between top-precedence agents
- Any irreversible, publicly visible action

Everything else is resolved by the precedence order in section 1.

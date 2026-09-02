# SciencePedia — Agent System Index

A 23-agent system for building and operating SciencePedia: a world-class science encyclopedia on **Next.js 15 · React · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Vercel**, with AI-generated content and an SEO-first architecture.

Agent specifications live in [.claude/agents/](../../.claude/agents/). Invoke any of them by name; use `project-orchestrator` as the default entry point for anything spanning more than one agent.

## The agents

### Control
| Agent | Owns |
|---|---|
| [project-orchestrator](../../.claude/agents/project-orchestrator.md) | Routing, sequencing, conflict resolution, gate enforcement |

### Strategy and definition
| Agent | Owns |
|---|---|
| [product-manager](../../.claude/agents/product-manager.md) | Strategy, roadmap, prioritization, user value |
| [product-designer](../../.claude/agents/product-designer.md) | Information architecture, learning experience, flows |
| [content-architect](../../.claude/agents/content-architect.md) | Knowledge taxonomy, entity model, encyclopedia structure |
| [seo-expert](../../.claude/agents/seo-expert.md) | Technical SEO, schema.org, topic clusters, internal linking |
| [growth-expert](../../.claude/agents/growth-expert.md) | Organic growth, retention, SEO expansion |

### Design
| Agent | Owns |
|---|---|
| [ux-designer](../../.claude/agents/ux-designer.md) | Usability, accessibility, navigation, search UX, mobile |
| [ui-designer](../../.claude/agents/ui-designer.md) | Visual design, color, typography, spacing, branding |
| [design-system-architect](../../.claude/agents/design-system-architect.md) | Design tokens, component library, UI standards |

### Engineering
| Agent | Owns |
|---|---|
| [frontend-architect](../../.claude/agents/frontend-architect.md) | Next.js architecture, routing, rendering, scalability |
| [frontend-engineer](../../.claude/agents/frontend-engineer.md) | Production UI implementation |
| [backend-architect](../../.claude/agents/backend-architect.md) | Supabase schema, APIs, auth, data architecture |
| [database-architect](../../.claude/agents/database-architect.md) | Physical DB design, indexing, query optimization |

### Content
| Agent | Owns |
|---|---|
| [science-editor](../../.claude/agents/science-editor.md) | Scientific accuracy, editorial standards — **absolute veto** |
| [ai-content-generator](../../.claude/agents/ai-content-generator.md) | Article generation from trusted sources |
| [fact-checker](../../.claude/agents/fact-checker.md) | Claim, citation and numerical verification |
| [localization-expert](../../.claude/agents/localization-expert.md) | Multilingual content, translation quality, i18n |

### Quality and operations
| Agent | Owns |
|---|---|
| [qa-engineer](../../.claude/agents/qa-engineer.md) | Test strategy, quality gates, release readiness |
| [playwright-test-engineer](../../.claude/agents/playwright-test-engineer.md) | End-to-end tests, visual/a11y/SEO automation |
| [performance-engineer](../../.claude/agents/performance-engineer.md) | Core Web Vitals, caching, images, loading speed |
| [security-engineer](../../.claude/agents/security-engineer.md) | Security review, secrets, RLS, vulnerabilities |
| [devops-engineer](../../.claude/agents/devops-engineer.md) | CI/CD, environments, monitoring, cost, incidents |
| [data-analyst](../../.claude/agents/data-analyst.md) | Analytics, traffic analysis, experiments, insight |

## Process documents

| Document | Contents |
|---|---|
| [collaboration-workflow.md](collaboration-workflow.md) | Workstreams, feature and content workflows, handoff contracts, blocking authority, escalation |
| [development-lifecycle.md](development-lifecycle.md) | Phases 0–6, the per-change pipeline, the six release gates, Definition of Done |
| [agent-dependency-graph.md](agent-dependency-graph.md) | Layered map, dependency edges, veto graph, critical paths, cycle breakers |

## The rules that govern everything

1. **Accuracy is absolute.** `science-editor` holds a veto no agent and no deadline can override. Nothing publishes without passing `fact-checker` first.
2. **Conflict precedence:** accuracy → security → accessibility → legal/privacy → performance → SEO → scope → design preference → developer convenience.
3. **SEO-first is architectural.** Content must exist in server-rendered HTML; URLs are permanent; every page ships with metadata, JSON-LD and real internal links.
4. **Structure precedes volume.** Taxonomy and templates are frozen for a branch before mass generation touches it.
5. **Six gates on every release** — accuracy, security, accessibility, performance, SEO, functional — all required, run in parallel.
6. **One owner per task.** Reviewers are named separately; handoffs must satisfy the receiver's documented Inputs or they are returned.

## Where to start

| Situation | Start with |
|---|---|
| Greenfield project | `project-orchestrator` → Phase 0 of the lifecycle |
| New feature | `product-manager` |
| New content batch | `content-architect` |
| Something is broken | `project-orchestrator` (it has the routing table) |
| "Is this working?" | `data-analyst` |

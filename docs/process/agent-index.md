# SciencePedia — Agent Index

Lean operating system: **8 agents, 9 skills**. Agents decide; skills execute repeatable procedures.

Stack: Next.js 15 · React · TypeScript · Tailwind · shadcn/ui · Supabase · Vercel · AI-generated content · SEO-first · knowledge-graph-first.

## Agents

| Agent | Owns | Skills |
|---|---|---|
| [project-orchestrator](../../.claude/agents/project-orchestrator.md) | Routing, sequencing, gates, conflicts | all nine |
| [knowledge-architect](../../.claude/agents/knowledge-architect.md) | **Entities, relationships, taxonomy, learning graph** | `knowledge-graph-manager`, `category-manager`, `content-research` |
| [product-designer](../../.claude/agents/product-designer.md) | Sitemap, UX, navigation, search, learning paths, UI system | `category-manager`, `knowledge-graph-manager`, `content-research` |
| [science-editor](../../.claude/agents/science-editor.md) | Scientific accuracy — **absolute veto** | `content-research`, `fact-check`, `article-generator` |
| [seo-expert](../../.claude/agents/seo-expert.md) | Technical SEO, schema, clusters, internal links | `seo-optimizer`, `knowledge-graph-manager`, `category-manager` |
| [frontend-engineer](../../.claude/agents/frontend-engineer.md) | Next.js architecture, UI, performance, tests | `image-finder`, `category-manager`, `knowledge-graph-manager` |
| [backend-architect](../../.claude/agents/backend-architect.md) | Supabase, search, RLS, schema, ops | `supabase-manager`, `knowledge-graph-manager` |
| [content-curator](../../.claude/agents/content-curator.md) | Library quality + runs the article pipeline | `knowledge-graph-manager`, `content-research`, `fact-check` |

`knowledge-architect` is the most important agent: pages, clusters, links, categories and learning paths are all projections of the graph it owns.

## Skills

| Skill | Does | Chain step |
|---|---|---|
| [content-research](../../.claude/skills/content-research/SKILL.md) | Gather and rank authoritative sources | 1 |
| [fact-check](../../.claude/skills/fact-check/SKILL.md) | Verify claims, citations, numbers | 2 (+ audits) |
| [article-generator](../../.claude/skills/article-generator/SKILL.md) | Draft from validated sources | 3 |
| [knowledge-graph-manager](../../.claude/skills/knowledge-graph-manager/SKILL.md) | Entities + typed relationships | 5 |
| [seo-optimizer](../../.claude/skills/seo-optimizer/SKILL.md) | Briefs, metadata, JSON-LD, links | 6 |
| [category-manager](../../.claude/skills/category-manager/SKILL.md) | Taxonomy placement + tree health | 7 |
| [image-finder](../../.claude/skills/image-finder/SKILL.md) | Licensed, correct figures | 8 |
| [translation](../../.claude/skills/translation/SKILL.md) | Locale variants with terminology control | 9 |
| [supabase-manager](../../.claude/skills/supabase-manager/SKILL.md) | Schema, RLS, migrations, queries, writes | 10 |

## Agent → skill map

```
project-orchestrator  ──> (all nine, dispatch only)
knowledge-architect   ──> knowledge-graph-manager · category-manager · content-research
product-designer      ──> category-manager · knowledge-graph-manager · content-research
science-editor        ──> content-research · fact-check · article-generator
seo-expert            ──> seo-optimizer · knowledge-graph-manager · category-manager
frontend-engineer     ──> image-finder · category-manager · knowledge-graph-manager
backend-architect     ──> supabase-manager · knowledge-graph-manager
content-curator       ──> knowledge-graph-manager · content-research · fact-check
```

`knowledge-graph-manager` is shared by seven of eight agents — that is the point. One graph, many projections.

## Documents
| File | Contents |
|---|---|
| [collaboration-workflow.md](collaboration-workflow.md) | How agents work together + the publishing workflow |
| [development-lifecycle.md](development-lifecycle.md) | Phases, gates, definition of done |
| [agent-dependency-graph.md](agent-dependency-graph.md) | Who depends on whom, who can block whom |

The previous 23-agent system is archived at `docs/archive/full-system-v1/`.

## The five rules
1. **Accuracy is absolute.** `science-editor` vetoes; nothing overrides it.
2. **The graph leads.** Categories, links, paths and clusters derive from `knowledge-architect`'s model — never hand-maintained separately.
3. **Structure before volume.** No generation into an unmodeled branch.
4. **Server-rendered or it does not exist.** SEO is architectural.
5. **Three gates on every change:** accuracy · technical · SEO.

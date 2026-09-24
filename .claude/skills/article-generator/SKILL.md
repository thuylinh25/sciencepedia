---
name: article-generator
description: Draft a SciencePedia article from a validated source pack, a content brief and an entity template. Use after content-research and fact-check have passed. Never use it to write from memory.
---

# Article Generator

Step 3 of the article chain. Turns a validated source pack into a draft with full provenance. It **drafts** — it never publishes.

## Inputs
- `content/research/<slug>.yaml` — validated source pack
- `content/checks/<slug>.yaml` — pre-draft verdict (must be `pass`)
- Content brief from `seo-expert`: target query, intent, required sections, internal links
- Entity template from `knowledge-architect`

## Procedure
1. Refuse to start if the source pack is missing or its check verdict is not `pass`.
2. Build the section outline from the entity template plus the brief. Do not invent sections.
3. Write each section using only the source pack. Every factual sentence maps to a source id.
4. Produce, in order:
   - **One-sentence definition** — what this is, plainly
   - **Key facts** — 4–8 items, each with value, unit and source
   - **Body sections** — mechanism and why it matters, not just a fact list
   - **A closing move** — see rule 10. Not optional, and not the last body section trailing off.
   - **Related concepts** and **prerequisites**, from the knowledge graph
   - **Citations** — every source actually used
5. Generate reading-level variants: **Simple** / **Standard** / **Technical**. They must never contradict each other.
6. Emit the **uncertainty report**: low-confidence claims, gaps, contested points.
7. Emit the **claim map**: every substantive sentence → source ids.

## Output
`content/drafts/<slug>.mdx` plus `content/drafts/<slug>.meta.yaml` (claim map, uncertainty report, generation run: model, prompt version, timestamp, sources used).

## Rules
1. **Source pack or nothing.** No parametric memory, ever.
2. **Never invent a citation.** The single worst failure mode — a fabricated or mismatched reference halts the pipeline.
3. **Keep the source's hedging — including the quiet kind.** Do not upgrade "evidence suggests" into "scientists proved". The failure is rarely that blatant. Watch for the words a careful source sprinkles and a draft silently drops: *theorized*, *may be*, *scientists think*, *is thought to*, *estimated*, *as of <year>*. If the source hedges three times in a paragraph, the draft hedges three times.
4. **Explain mechanisms.** A list of facts with no "why" or "how" has failed the educational purpose.
5. **Write for the reader, not the crawler.** Follow the brief's structure, but never keyword-stuff, pad or repeat.
6. **Flag, do not fill.** Where sources are thin, say so in the uncertainty report — never smooth it over with plausible prose.
7. **Numbers carry units, uncertainty and an as-of date.**
8. **No self-approval.** Every draft goes to `science-editor`.
9. **Quote sparingly and licence-safely.** No reproduced copyrighted text beyond fair quotation.
10. **Close the article deliberately.** The last body section must not simply stop. End with one of the three moves the library already uses: a `## Kết luận` heading, a short emoji-led paragraph that states what the reader should carry away, or a `>` blockquote doing the same. For an article rewritten from an outside piece, the attribution line closes it; for health content, the medical disclaimer does.

    Why this rule exists: it was missing, and the gap is measurable. A survey of all 58 articles (`scripts/check-closure.ts`) found nine — every one of them a planet or astronomy piece of 242–361 words — ending on a final section under 60 words, one of them on a bullet about Phobos and Deimos placed under a heading called "Extreme terrain". The step list above named every other part of an article and never named this one, so whether a draft got a closing move was left to chance. Roughly one draft in five lost the toss.

    There is no length gate any more (the 2–3 minute cap was dropped on 2026-09-24), so nothing mechanical catches a stub. Closure is now checked only by the closure warning in `scripts/check-publish.ts` and by `science-editor` reading the draft.

11. **Do not draw a boundary the source does not draw.** Sources name a category; drafts turn it into a two-sided line. If a source says radiation above some energy is *ionising* and can damage cells, that is a statement about one side. Writing "the boundary between the harmless part and the dangerous part" invents the other side — and gets it wrong, because non-ionising radiation is not harmless. Name what the source names; leave the complement unnamed.

12. **Correlation in the source stays correlation in the draft.** A source that says the Sun is the dominant emitter in the band our eyes use has stated a relationship. Writing that the eye *evolved to* match that band asserts a cause, and the source did not. Evolutionary "why" sentences are where this happens most: they read well, they are usually plausible, and they are almost never in the source pack.

    Why rules 11 and 12 exist: `science-editor` reviewed a batch of ten glossary entries on 2026-09-21 and cut four passages. All four were unsourced, and all four were the same three shapes — a dropped hedge, an invented boundary, an invented cause. Rule 3 already covered the first and was still violated three times, which is why it now lists the specific words. The other two shapes had no rule at all. None of the four was a fabricated citation; each was a true-sounding sentence added *between* sourced ones, which is exactly the kind a reviewer has to catch by reading the source rather than by checking the reference list.

13. **Two sources that disagree do not both get to be right — and neither does the convenient one.** When the pack contains a loose statement and a precise one about the same thing, the precise one wins, and the draft says what the precise one says. Being faithful to a source is not a defence against being wrong.

14. **A consequence you derive must be checked against the whole source page, not just the sentence it came from.** Taking a true statement and stating its implication is how a draft earns its keep — and it is also where a draft can contradict the very page it cites, two paragraphs further down.

15. **Picking one item from a list and presenting it as the whole is a fabrication, even though every word came from the source.** If the source gives three mechanisms and the draft gives one, the draft has told the reader the wrong thing about how the world works — and it did so without adding a single unsourced word.

    Why rules 13–15 exist: they come from the SECOND glossary batch (2026-09-21), reviewed after rules 3, 11 and 12 were already in force. Those three worked — the old shapes recurred only twice, both minor. The three worst errors in the batch were shapes no rule covered, because 3, 11 and 12 all police the relation between *a sentence in the draft* and *a sentence in the source*. These three are about the relation between the draft and the source **as a whole**:

    - **13** — An entry stated the Earth and Moon are tidally locked to each other, quoting NASA's Moon Facts verbatim. NASA's own Tidal Locking page says Earth will *also* become tidally locked in roughly 50 billion years. Two NASA pages, one loose and one precise; the draft took the loose one and told readers something false about the length of a day.
    - **14** — A source says nuclear binding energy is roughly proportional to nucleon count for A > 8. The draft derived "so binding energy per nucleon is nearly constant". The same page gives 6–10 MeV with a peak at iron-56, and if the derived claim were true there would be no fusion and no fission — the entry contradicted itself in one sentence.
    - **15** — A source lists three mechanisms that end a neurotransmitter signal. The draft kept one and called it *the* determining factor.

16. **When two sources define the same term at different SCOPE, the higher-tier source's scope wins.** Rule 13 covers loose versus precise. This is different: both sources are precise, but one draws the boundary narrower than the other. A textbook may tie a term to one particular technique; the standards body or agency that owns the field may define it without that tie. Take the wider definition, and never let a narrow one leak into a neighbouring entry as if it were the whole category.

17. **Silence in a source is not evidence, and a paragraph about the source pack is not written for the reader.** "The page does not claim X" is not a source for "not X" — a reader receives it as a sourced conclusion when the source concluded nothing. The cheap tell: if a paragraph talks *about the sources* rather than *about the subject*, it is addressed to the reviewer. Move it to the notes and write the reader a paragraph that says something.

    Why rules 16 and 17 exist: the THIRD glossary batch (2026-09-21), reviewed with rules 3 and 11–15 already in force. Those held — the old shapes recurred only mildly. The two worst errors were new:

    - **16** — An entry defined genetic engineering using OpenStax's wording, which ties it to recombinant DNA technology. NHGRI, the agency that owns the field, defines it without that tie. The draft took the narrower definition from the lower-tier source, and then that narrow definition **leaked into the CRISPR entry**, where it produced a claim that is simply wrong: CRISPR editing is not recombinant DNA technology in the plasmid sense OpenStax means. One scope error, two entries damaged. It was also a rule-14 failure in the second entry: the cited OpenStax page never mentions CRISPR at all.
    - **17** — A placebo entry closed by saying the source claims no mechanism beyond anticipation and does not suggest placebos replace evidence-based treatment. Both statements are accurate descriptions of the page. Neither is something the page says, and the reader takes them as conclusions. Replaced with the placebo-controlled trial material that was on the page all along.

## Fails when
The source pack is insufficient, or a section required by the template cannot be sourced. Return a gap report rather than a padded article.

# Foundational Model of Anatomy — attribution

Foundational Model of Anatomy Ontology (FMA), version 5.1.0.
© Structural Informatics Group, University of Washington.
Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).

- Release: http://sig.biostr.washington.edu/share/downloads/fma/release/latest/
- License file in that release: `LICENSE` (full CC BY 4.0 legal code), checked 2026-09-28.
  The OBO Foundry and EBI OLS registries list the license as "CUSTOM" with a dead link;
  the release file is the authority.
- License terms: https://creativecommons.org/licenses/by/4.0/
- Accessed through: EBI Ontology Lookup Service, https://www.ebi.ac.uk/ols4/ontologies/fma
  (serving FMA 5.1.0; `scripts/anatomy-enrich.ts` refuses to run if the served version differs).
- Publication: Rosse C, Mejino JLV Jr. A reference ontology for biomedical informatics: the
  Foundational Model of Anatomy. J Biomed Inform. 2003;36(6):478–500.
  https://doi.org/10.1016/j.jbi.2003.11.007

Adaptations: for each FMA identifier used by BodyParts3D 4.0, the preferred name, Latin
non-English equivalents (only values FMA tags with language "Latin"), English synonyms,
direct is-a parents, part-of parents (regional, constitutional, systemic, member-of) and the
TA_ID recorded on the preferred name (Terminologia Anatomica 1998) were extracted and
reformatted as JSON. No facts were added or inferred. Nine BodyParts3D identifiers that no
longer exist in FMA 5.1.0 are listed under `unresolved` and carry no FMA data.

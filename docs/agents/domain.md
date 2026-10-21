# Domain Docs

How the engineering skills should consume and write this repo's domain documentation.

The glossary and the ADRs live in the **GitHub wiki**, not in the code repo: the repo holds code only, so no documentation can rot next to it. Wiki pages are written in Italian.

## Where the wiki is

- Web: https://github.com/AndreaMinato/dog-watch/wiki
- Git: `git@github.com:AndreaMinato/dog-watch.wiki.git`, cloned as a sibling of this repo at `../dog-watch.wiki`. If the clone is missing, clone it there; if it exists, `git -C ../dog-watch.wiki pull` before reading.

## Before exploring, read these

- **`Glossario.md`** in the wiki.
- **ADRs** in the wiki: pages named `ADR-NNNN-<slug>.md`, indexed by `ADR.md`. Read the ones that touch the area you're about to work in.

If any of these pages don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## Writing

Wherever a skill says `GLOSSARY.md` or `docs/adr/`, write the wiki page instead:

| Skill expects            | Write in the wiki                                  |
| ------------------------ | -------------------------------------------------- |
| `GLOSSARY.md`            | `Glossario.md`                                     |
| `docs/adr/NNNN-<slug>.md` | `ADR-NNNN-<slug>.md`, plus a line in `ADR.md`     |

Wiki layout:

```
../dog-watch.wiki/
├── Home.md
├── Glossario.md
├── ADR.md                     ← index: one line per ADR, newest last
├── ADR-0001-<slug>.md
└── _Sidebar.md                ← links Home, Glossario, ADR
```

Commit with a Conventional Commit message (`docs: add ADR-0003 ...`) and push straight to the wiki's `master`; the wiki has no PRs. Link the ADR from the issue or PR that motivated it.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `Glossario.md`. Code identifiers are English: the glossary records the English identifier next to each Italian term. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_

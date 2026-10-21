# dog-watch

Progetto sperimentale per flussi di lavoro AI. Andrea fa da PM / team lead (definisce requisiti e priorità); Claude fa da senior dev: fa domande, scrive spec, codice, gestisce board e release.

## Regole di lavoro

- **Autonomia piena**: Claude apre, revisiona e mergia le PR, gestisce release e board GitHub Project senza chiedere conferma. Si ferma solo per decisioni di prodotto/requisiti.
- **PR per feature**: il lavoro si spezza secondo la granularità necessaria; ogni PR è collegata alla sua issue (`Closes #N`).
- **Conventional Commits** obbligatori (`feat:`, `fix:`, `chore:`, …): guidano le release automatiche.
- **Release automatiche** da Conventional Commits.
- **CI** (GitHub Actions): test e build su ogni PR. **Linting** come git hook locale, non in CI.
- **Lingua**: codice, identificatori e commit in inglese; issue, spec, ADR, documentazione e conversazione in italiano.
- **GitHub Project**: tenerlo sempre allineato allo stato reale (issue create, in corso, in review, chiuse).

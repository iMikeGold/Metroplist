# Metroplist Data Foundation and Density Explorer — Release 0.1

This project is the operational web-application surface inside the wider Metroplist repository.

Release 0.1 establishes a portable, time-aware geographical evidence foundation and a minimal Density Explorer shell. It deliberately contains no fabricated population observations and creates no remote infrastructure.

## Governing principles

- Places, geographies, boundaries, indicators, observations, sources and interpretations are separate records.
- Historical observations are append-only.
- A later period does not replace an earlier period.
- Corrections, rebases and withdrawals are new linked records.
- Public comparison routes are reversible views over canonical evidence, not duplicated facts.
- External APIs belong to controlled ingestion workflows, not ordinary page requests.
- Legacy conversation material and media sources are research context until independently verified.
- Historical thought experiments are scenarios, not canonical observations.
- Constructed territories are explicit composites, not ordinary place records.
- D1 is the first physical store, not the permanent definition of the data model.

## Local commands

```bash
npm run dev
npm run verify
npm run build
npm run db:migrate:local
npm run db:seed:local
```

No command in this project deploys, commits, pushes or creates remote Cloudflare resources.

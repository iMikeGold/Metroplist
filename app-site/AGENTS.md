# Metroplist App-Site Agent Rules

## Release identity

Metroplist Data Foundation and Density Explorer — Release 0.1.

## Non-negotiable rules

1. Do not fabricate population, area, density, migration, unemployment or other observed values.
2. Do not promote legacy notes, conversations or candidate anchor places into verified facts.
3. Do not overwrite or delete historical observations. Use revision, lineage and status-history records.
4. Do not treat a later reference period as a correction of an earlier period.
5. Do not silently compare incompatible boundaries, geographic scales, units or methodologies.
6. Do not fetch and publish unknown external data during a public request.
7. Do not place database access inside React presentation components.
8. Do not deploy, create remote Cloudflare resources, commit or push unless explicitly instructed.
9. Keep `main-site/` and `app-site/` separate projects within the single Metroplist Git repository.
10. Preserve portability beyond D1 through repository interfaces and canonical exports.

## Required verification

Run:

```bash
npm run verify
npm run build
```

before presenting implementation work as complete.

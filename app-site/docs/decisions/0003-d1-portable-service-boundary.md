# ADR 0003: D1 behind portable service boundaries

## Status

Accepted for initial implementation.

## Decision

D1 is the first structured operational store. Domain modules and presentation code depend on repository interfaces rather than D1-specific APIs.

## Consequence

Metroplist can later add or migrate to PostGIS, a warehouse, search index, graph layer or internal API without redefining places and observations.

# System architecture

## Presentation

Next.js routes and components render user-facing search, comparison, timeline and provenance views.

## Application services

Services resolve places, select compatible observations, calculate relationships and return explicit failure states.

## Domain modules

Domain modules contain types, validation schemas, calculations and rules. They cannot depend on React or D1.

## Repository interfaces

Repositories expose storage-neutral contracts. D1 adapters may implement them without leaking SQL into the domain or interface.

## Physical data

D1 begins as the structured operational database. R2 is reserved for source files, boundary geometry, archived responses and large manifests. Future PostGIS, analytical warehouses, graph layers and search indexes may be added without redefining the logical model.

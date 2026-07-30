# ADR 0001: Single repository, separate site projects

## Status

Accepted for Release 0.1.

## Decision

`main-site/` and `app-site/` remain separate projects inside the single Metroplist Git repository.

## Consequences

They can have separate dependencies, build configurations and Cloudflare deployments while sharing one institutional history. No nested `.git` directory should be added.

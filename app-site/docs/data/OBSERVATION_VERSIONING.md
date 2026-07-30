# Observation versioning

Observations are append-only.

A later reference period is an additional observation, not a replacement:

- 2021 population remains valid as a 2021 record.
- 2026 population is added as a 2026 record.

A correction to the same period is also a new observation. The relationship is recorded in `observation_revisions`, and preference changes are recorded in `observation_status_history`.

Original releases, corrected releases, rebased series and Metroplist derivations remain separately addressable.

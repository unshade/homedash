# 1. Record architecture decisions

Date: 2026-11-01

## Status

Accepted

## Context

homedash is built by its author together with AI coding agents. Neither keeps the "why" behind structural choices between sessions, and future contributors will need it too.

## Decision

We record architecturally significant decisions as ADRs in `docs/decisions/`, using the Nygard template (Status, Context, Decision, Consequences).

- Files are named `NNNN-present-tense-verb-phrase.md`, numbered sequentially and zero-padded (e.g. `0008-store-data-in-postgresql-with-gorm-generics.md`).
- Every ADR is listed in [`INDEX.md`](INDEX.md).
- One decision per ADR. We only write one when a decision affects structure, interfaces or quality attributes, or is costly to reverse. Style rules go in `AGENTS.md`, not in ADRs.
- Accepted ADRs are not rewritten. A changed decision gets a new ADR, and the old one is marked `Superseded by NNNN`.

## Consequences

- The reasons behind the structure stay with the code and can be reviewed in pull requests.
- Writing an ADR adds a small cost to structural changes. The "only when needed" rule keeps that cost low.

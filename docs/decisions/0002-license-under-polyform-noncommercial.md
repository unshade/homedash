# 2. License under PolyForm Noncommercial 1.0.0

Date: 2026-11-01

## Status

Accepted

## Context

The author wants homedash to be free for everyone to use, self-host, modify and share, with three conditions:

- Only the author may make money from it, for example by selling a hosted version.
- Anyone who forks or redistributes it must credit the author.
- Every OSI "open source" license allows commercial use, so none of them fit.

## Decision

homedash is licensed under the [PolyForm Noncommercial License 1.0.0](../../LICENSE), with this line at the end of `LICENSE`:

```
Required Notice: Copyright (c) 2026 Noé Steiner (https://github.com/unshade/homedash)
```

- Any noncommercial use is allowed: personal, hobby, charity, education.
- Anyone who passes on any part of the code must include the license and the Required Notice, which provides the credit.
- As copyright holder, the author is not bound by the license and can sell homedash or license it commercially.

We considered the Elastic License 2.0, which only forbids selling the software as a hosted service. We rejected it because it lets companies use homedash commercially in other ways.

## Consequences

- homedash is "source-available", not "open source", and should be described that way.
- Code from outside contributors is only received under these noncommercial terms. Before the author sells anything that includes such code, contributors must sign a contributor license agreement (CLA) that grants commercial rights. Set one up before accepting external pull requests.
- Companies cannot use homedash without a separate commercial license.

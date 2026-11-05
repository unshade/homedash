# 20. Release from Conventional Commits with semantic-release

Date: 2026-11-05

## Status

Accepted

## Context

The author wants every commit to main to be tagged with a version and recorded in a changelog, from the Conventional Commits the project already uses (`feat: ...`, `fix: ...`), and suggested release-it "or another thing better".

The candidates:

- **release-it** is built for a person running a release from their machine; in CI it works, but versioning from commits needs a plugin, and it is less common for fully automatic releases.
- **release-please** opens a release pull request that has to be merged to release: a second step per release, which the author did not ask for.
- **semantic-release** releases on every push to the release branch, with no human step: it picks the version from the commits, writes the changelog, tags and creates the GitHub release. It is the most used tool for exactly this.
- Go-native tools (goreleaser, svu, git-chglog) either don't write a changelog file, are unmaintained, or would add large conflicting dependencies to `tools/go.mod` (as actionlint did).

## Decision

- **semantic-release** runs in CI after every push to main that passes all checks (`release` job, `task release`). It uses the `conventionalcommits` preset: `feat` → minor, `fix`/`perf` → patch, other types don't release. While homedash is 0.x, a breaking change (`!` or `BREAKING CHANGE:`) bumps the minor version, not to 1.0.0.
- It writes `CHANGELOG.md` and commits it to main as `chore(release): X.Y.Z [skip ci]`, tags `vX.Y.Z`, and creates the GitHub release with the same notes. It needs only `contents: write`; issue and pull request comments are off.
- The release tooling (semantic-release, its plugins, commitlint) is pinned in `tools/release/package.json` and its lockfile, the Node counterpart of `tools/go.mod`, and run through tasks.
- Pull requests are checked with **commitlint** (`@commitlint/config-conventional`, `task commitlint`), because a badly written message would be skipped or release the wrong version.

## Consequences

- Versions and the changelog need no manual work; the commit messages are the input, so they must be written for readers of the changelog.
- The first release is computed from the whole history. Without a tag, semantic-release starts at 1.0.0; tagging the first commit `v0.0.0` beforehand makes the first release 0.1.0.
- The release job pushes a commit to main with the workflow's token. If main gets a branch protection rule or ruleset that requires pull requests, GitHub Actions must be allowed to bypass it, or the release fails.
- Merge commits ("Merge pull request #N") are ignored by both tools; the commits inside the pull request are what count. With squash merging, the pull request title would become the commit and would have to follow the convention.

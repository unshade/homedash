/**
 * semantic-release (ADR 20): on every push to main that passes CI, reads the
 * Conventional Commits since the last tag, picks the next version, writes
 * CHANGELOG.md, tags vX.Y.Z and creates the GitHub release. The image is then
 * published by the ci.yml "publish" job. Run with `task release` (CI) or
 * `task release:dry-run`.
 */
export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    // feat → minor, fix and perf → patch, a breaking change (`feat!:` or a
    // `BREAKING CHANGE:` footer) → major.
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md', changelogTitle: '# Changelog' }],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'],
        // [skip ci]: the changelog commit must not start another release.
        message: 'chore(release): ${nextRelease.version} [skip ci]',
      },
    ],
    [
      '@semantic-release/github',
      // Only the release itself: no issues or pull request comments, so the
      // job needs no permission beyond contents: write.
      { successComment: false, failComment: false, releasedLabels: false },
    ],
    [
      '@semantic-release/exec',
      // Hands the new version to the job that publishes the image.
      { successCmd: 'echo "version=${nextRelease.version}" >> "$GITHUB_OUTPUT"' },
    ],
  ],
}

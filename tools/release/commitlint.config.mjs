/**
 * Commit messages follow Conventional Commits (see AGENTS.md): semantic-release
 * reads them to choose the next version and write the changelog.
 */
export default {
  extends: ['@commitlint/config-conventional'],
}

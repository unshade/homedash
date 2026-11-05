import config from './release.config.mjs'

/**
 * `task release:dry-run`: the release config with only the steps that need no
 * token (version and release notes), each with its real options. Passing
 * `--plugins` on the command line instead would drop those options (the preset
 * among them) and test something else than CI runs.
 */
const local = new Set(['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator'])

export default {
  ...config,
  plugins: config.plugins.filter((plugin) => local.has(Array.isArray(plugin) ? plugin[0] : plugin)),
}

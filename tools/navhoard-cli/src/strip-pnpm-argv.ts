/**
 * When a script is run via `pnpm run <name> -- <args>` (often through `--filter`),
 * Node may receive argv like: `node script.js -- capture --url …`.
 * Strip forwarded `--` at index 2 so Commander sees the subcommand/options.
 */
export function stripPnpmArgvSeparators (argv: readonly string[]): string[] {
  const out = [...argv];
  while (out.length > 2 && out[2] === '--') {
    out.splice(2, 1);
  }
  return out;
}

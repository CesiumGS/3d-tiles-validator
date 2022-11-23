import minimatch from "minimatch";

/**
 * Returns a function that receives a string, and returns whether
 * the string matches the given glob
 *
 * @param glob - The glob expression
 * @param ignoreCase - Whether the matching should be case-insensitive
 * @returns The matcher
 */
export function globMatcher(
  glob: string,
  ignoreCase = true
): (s: string) => boolean {
  const Minimatch = minimatch.Minimatch;
  const mm = new Minimatch(glob, { nocase: ignoreCase });
  return (s: string) => mm.match(s);
}

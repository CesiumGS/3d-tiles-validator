/**
 * Returns the first parameter if not undefined, otherwise the second parameter.
 * Useful for setting a default value for a parameter.
 *
 * @param a The first parameter
 * @param b The second parameter
 * @returns Returns the first parameter if not undefined, otherwise the second parameter.
 */
export function defaultValue<T>(a: T | undefined, b: T): T {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}

/**
 * Returns the first parameter if not undefined, otherwise the second parameter.
 * Useful for setting a default value for a parameter.
 *
 * @param {any} a
 * @param {any} b
 * @returns {any} Returns the first parameter if not undefined, otherwise the second parameter.
 */
export function defaultValue(a: any, b: any) {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}

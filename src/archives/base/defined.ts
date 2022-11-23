/**
 * Returns whether the given value is not `undefined` and not `null`
 *
 * @param value - The value to check.
 * @returns `true` if the value is not `undefined` and not `null`
 */
export function defined(value: any): boolean {
  return value !== undefined && value !== null;
}

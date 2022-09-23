/**
 * Returns whether the given value is not `undefined` and not `null`
 *
 * @param  {any} value The value to check.
 * @return {boolean} `true` if the value is not `undefined` and not `null`
 */
export function defined(value: any): boolean {
  return value !== undefined && value !== null;
}

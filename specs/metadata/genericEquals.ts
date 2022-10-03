import { equalsEpsilon } from "./equalsEpsilon";

/**
 * A function for checking values for equality, taking into account the
 * possibility that the values are arrays or numbers.
 *
 * This is ONLY used in the specs, to compare metadata values.
 *
 * @param a The first element
 * @param b The second element
 * @param epsilon A relative epsilon
 * @returns Whether the objects are equal
 */
export function genericEquals(a: any, b: any, epsilon: number): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (!genericEquals(a[i], b[i], epsilon)) {
        return false;
      }
    }
    return true;
  }
  if (typeof a === "number") {
    return equalsEpsilon(a, Number(b), epsilon);
  }
  return a === b;
}

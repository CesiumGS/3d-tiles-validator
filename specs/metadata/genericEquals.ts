import { equalsEpsilon } from "./equalsEpsilon";

// TODO Do this Jasmine hookup thing instead of this:
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

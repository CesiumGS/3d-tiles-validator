import { defaultValue } from "../../src/base/defaultValue";

// TODO Do this Jasmine hookup thing instead of this:
export function equalsEpsilon(
  left: number,
  right: number,
  relativeEpsilon: number,
  absoluteEpsilon?: number
) {
  relativeEpsilon = defaultValue(relativeEpsilon, 0.0);
  absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
  const absDiff = Math.abs(left - right);
  return (
    absDiff <= absoluteEpsilon! ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
  );
}

import { defaultValue } from "../../src/base/defaultValue";

/**
 * Returns whether two numbers are equal, up to a certain epsilon
 *
 * @param left The first value
 * @param right The second value
 * @param relativeEpsilon The maximum inclusive delta for the relative tolerance test.
 * @param absoluteEpsilon The maximum inclusive delta for the absolute tolerance test.
 * @returns Whether the values are equal within the epsilon
 */
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

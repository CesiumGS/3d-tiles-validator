import { defined } from "3d-tiles-tools";

/**
 * Internal utility methods for validation issues
 *
 * @internal
 */
export class ValidationIssueUtils {
  /**
   * Creates a short string with a verbal description of the
   * given range. This requires at least one of the given
   * arguments to be defined.
   *
   * @param min - The minimum
   * @param max - The maximum
   * @returns The description
   */
  static describeSimpleRange(
    min: number | undefined,
    max: number | undefined
  ): string {
    if (defined(min) && defined(max)) {
      if (min == max) {
        return `${min}`;
      } else {
        return `at least ${min} and at most ${max}`;
      }
    } else if (defined(min)) {
      return `at least ${min}`;
    } else if (defined(max)) {
      return `at most ${max}`;
    }
    // Should never happen
    return "";
  }

  /**
   * Joins the given strings, enclosed in single quotes,
   * using commas and the given conjunction ("and" or "or").
   *
   * Examples:
   *
   * undefined : undefined
   * [] : ""
   * ["a"] : "'a'"
   * ["a", "b"] : "'a' and 'b'"
   * ["a", "b", "c"] : "'a', 'b', and 'c'"
   *
   * @param conjunction - The conjunction to use
   * @param s - The strings
   * @returns The joined names
   */
  static joinNames(conjunction: string, ...s: string[]) {
    if (!defined(s)) {
      return undefined;
    }
    if (s.length === 0) {
      return "";
    }
    const t = s.map((e) => "'" + e + "'");
    if (t.length === 1) {
      return t[0];
    }
    if (t.length === 2) {
      return t[0] + " " + conjunction + " " + t[1];
    }
    return (
      t.slice(0, -1).join(", ") + ", " + conjunction + " " + t[t.length - 1]
    );
  }
}

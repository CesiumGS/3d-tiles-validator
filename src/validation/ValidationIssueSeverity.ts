
/**
 * An enumeration of different severity levels for a 
 * `ValidationIssue`
 */
export enum ValidationIssueSeverity {

  /**
   * An error, indicating that the validation failed
   */
  ERROR = "ERROR",

  /**
   * A warning, indicating that validation passed, but
   * the input might cause unexpected or undesired 
   * behavior in clients.
   */
  WARNING = "WARNING",
}

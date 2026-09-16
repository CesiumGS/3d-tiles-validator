/**
 * Internal class containing counters for issues with
 * a certain severity.
 *
 * @internal
 */
export class IssueCounters {
  /**
   * The number of errors
   */
  numErrors: number;

  /**
   * The number of warnings
   */
  numWarnings: number;

  /**
   * The number of infos
   */
  numInfos: number;

  /**
   * Creates a new instance
   */
  constructor() {
    this.numErrors = 0;
    this.numWarnings = 0;
    this.numInfos = 0;
  }

  add(issueCounters: IssueCounters) {
    this.numErrors += issueCounters.numErrors;
    this.numWarnings += issueCounters.numWarnings;
    this.numInfos += issueCounters.numInfos;
  }
}

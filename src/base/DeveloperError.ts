/**
 * An error that may be thrown to indicate a developer error.
 *
 * This usually refers to errors that are the result of calling
 * methods where the preconditions for calling the method do
 * not hold, and that should have been checked prior to the
 * method call.
 */
export class DeveloperError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, DeveloperError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

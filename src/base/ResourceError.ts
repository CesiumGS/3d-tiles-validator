/**
 * An error that may be thrown to indicate that an expected
 * resource could not be resolved.
 */
export class ResourceError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ResourceError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

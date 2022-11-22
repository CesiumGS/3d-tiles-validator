/**
 * An error that may be thrown to indicate that an invalid
 * operation was performed on a tileset archive.
 */
export class TilesetArchiveError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, TilesetArchiveError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

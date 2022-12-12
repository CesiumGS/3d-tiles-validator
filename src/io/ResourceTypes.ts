/**
 * Methods to determine resource type from buffer data.
 */
export class ResourceTypes {
  static isGzipped(buffer: Buffer): boolean {
    if (buffer.length < 2) {
      return false;
    }
    return buffer[0] === 0x1f && buffer[1] === 0x8b;
  }

  /**
   * Returns the magic header of the given buffer, as a string.
   *
   * This is a string that consists of the first 4 bytes of
   * the buffer data, or fewer bytes if the buffer has less
   * than 4 bytes.
   *
   * @param buffer - The buffer
   * @returns The magic header
   */
  static getMagic(buffer: Buffer): string {
    const length = Math.min(buffer.length, 4);
    const magic = buffer.toString("utf8", 0, length);
    return magic;
  }

  static startsWith(buffer: Buffer, magic: string) {
    if (buffer.length < magic.length) {
      return false;
    }
    const actual = buffer.toString("utf8", 0, magic.length);
    return actual === magic;
  }

  static isSubt(buffer: Buffer): boolean {
    return ResourceTypes.startsWith(buffer, "subt");
  }

  static isProbablyJson(buffer: Buffer): boolean {
    for (let i = 0; i < buffer.length; i++) {
      const c = String.fromCharCode(buffer[i]);
      // NOTE: This regex HAS to be declared here, otherwise the `test`
      // call will randomly return wrong values.
      // For details, refer to https://stackoverflow.com/q/3891641
      // They gotta be kidding. Un. Be. Lie. Va. Ble.
      const whitespaceRegex = /\s/g;
      if (whitespaceRegex.test(c)) {
        continue;
      }
      if (c === "{" || c === "[") {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }
}

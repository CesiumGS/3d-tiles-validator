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

  static getMagic(buffer: Buffer): string | undefined {
    if (buffer.length < 4) {
      return undefined;
    }
    const magic = buffer.toString("utf8", 0, 4);
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

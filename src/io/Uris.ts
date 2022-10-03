/**
 * Utility methods related to URI strings.
 *
 * TODO This could probably be replaced with an NPM library
 * for URI handling. The billion dollar question: Which one?
 */
export class Uris {
  static isDataUri(uri: string): boolean {
    const dataUriRegex = /^data:/i;
    return dataUriRegex.test(uri);
  }

  static isAbsoluteUri(uri: string): boolean {
    const s = uri.trim();
    if (s.startsWith("http://")) {
      return true;
    }
    if (s.startsWith("https://")) {
      return true;
    }
    return false;
  }
}

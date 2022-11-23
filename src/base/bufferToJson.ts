/**
 * Converts a buffer containing a utf-8 encoded JSON string to a JSON object.
 * If the buffer is undefined or empty, then an empty object will be returned.
 *
 * @param buffer - The buffer.
 * @returns A JSON object.
 */
export function bufferToJson(buffer?: Buffer): object {
  if (!buffer) {
    return {};
  }
  if (buffer.length === 0) {
    return {};
  }
  const s = buffer.toString();
  return JSON.parse(s);
}

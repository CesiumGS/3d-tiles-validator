import { defined } from "./defined";
import { Buffers } from "./Buffers";

/**
 * Converts a buffer containing a utf-8 encoded JSON string (without BOM) to a JSON object.
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
  const bom = Buffers.getUnicodeBOMDescription(buffer);
  if (defined(bom)) {
    const message = `Unexpected BOM in JSON buffer: ${bom}`;
    throw new Error(message);
  }
  const s = buffer.toString();
  return JSON.parse(s);
}

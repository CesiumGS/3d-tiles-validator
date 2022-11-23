/**
 * Returns whether the given buffer starts with the two magic bytes
 * that indicate that it contains GZIPped data.
 *
 * @param buffer - The buffer
 * @returns Whether the buffer is GZIPped data
 */
export function isGzipped(buffer: Buffer): boolean {
  if (buffer.length < 2) {
    return false;
  }
  const result = buffer[0] === 0x1f && buffer[1] === 0x8b;
  return result;
}

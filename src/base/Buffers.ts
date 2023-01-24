import { defined } from "./defined";

/**
 * Utility functions for buffers
 */
export class Buffers {
  /**
   * Returns a short string that describes the Unicode BOM (Byte Order Mask)
   * that the given buffer starts with, or `undefined` if the buffer does
   * not contain a BOM
   *
   * @param buffer - The buffer
   * @returns A short description of the BOM, or `undefined`
   * @internal
   */
  static getUnicodeBOMDescription(buffer: Buffer): string | undefined {
    if (Buffers.startsWith(buffer, [0xfe, 0xff])) {
      return "UTF-16 BE (FE FF)";
    }
    if (Buffers.startsWith(buffer, [0xff, 0xfe])) {
      return "UTF-16 LE (FF FE)";
    }
    if (Buffers.startsWith(buffer, [0xef, 0xbb, 0xbf])) {
      return "UTF-8 (EF BB BF)";
    }
    if (Buffers.startsWith(buffer, [0x00, 0x00, 0xfe, 0xbf])) {
      return "UTF-32 BE (00 00 FE FF)";
    }
    if (Buffers.startsWith(buffer, [0xff, 0xfe, 0x00, 0x00])) {
      return "UTF-32 LE (FF FE 00 00)";
    }
    return undefined;
  }

  /**
   * Returns whether the given buffer starts with the given sequence
   * of bytes.
   *
   * @param buffer - The buffer
   * @param bytes - The bytes
   * @returns Whether the buffer starts with the given bytes
   * @internal
   */
  private static startsWith(buffer: Buffer, bytes: number[]): boolean {
    if (!defined(buffer) || !defined(bytes)) {
      return false;
    }
    if (buffer.length < bytes.length) {
      return false;
    }
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[i] != bytes[i]) {
        return false;
      }
    }
    return true;
  }
}

import fs from "fs";

/**
 * Only for internal use:
 *
 * Writes the given string to the given file.
 * If the file cannot be written, then an error
 * message will be printed.
 *
 * @param filePath - The path to the file
 * @param data - The string
 * @returns A promise that resolves when the data is written
 */
export async function writeUnchecked(
  filePath: string,
  data: string
): Promise<void> {
  try {
    fs.writeFileSync(filePath, data, "utf8");
  } catch (error) {
    console.log(error);
  }
}

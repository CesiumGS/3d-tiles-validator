/**
 * An interface for classes that can resolve resources that
 * are given as URI strings, and return them as a Buffer.
 */
export interface ResourceResolver {
  /**
   * Resolve the data from the given URI.
   *
   * The given URI may be relative to the base URI for
   * which this instance has been created.
   *
   * @param uri The URI
   * @returns A promise that resolves with the buffer data,
   * or with `null` if the resource could not be resolved.
   */
  resolve(uri: string): Promise<Buffer | null>;

  /**
   * Derive an instance from this one, with a different base
   * directory.
   *
   * The given URI will be resolved against the base directory
   * of this instance. The returned instance will use the
   * resulting URI as its base URI.
   *
   * @param uri The relative path
   * @return A new instance with a different base URI
   */
  derive(uri: string): ResourceResolver;
}

/**
 * Summarizes state information about the validation of a certain
 * element. It contains information about
 * - whether the element was present in the input
 * - whether the element was valid
 *
 * This is used, for example, for the metadata schema definition
 * of a tileset: When the tileset defines a `schema` or `schemaUri`,
 * then the element was present (indicated by `wasPresent=true`).
 * The schema itself may still have been invalid. If it was
 * valid, then it will be stored as the `validatedElement`.
 * If it was not valid, then the `validatedElement` will remain
 * undefined.
 *
 * @internal
 */
export interface ValidatedElement<T> {
  /**
   * Whether a definition for the element was found
   */
  wasPresent: boolean;

  /**
   * The validated element.
   *
   * This can be `undefined` when...
   * - the input did not contain a definition (as indicated by
   *   `wasPresent=false`)
   * - the input was present (as indicated by `wasPresent= true`),
   *   but it was NOT valid
   */
  validatedElement: T | undefined;
}

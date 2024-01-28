/**
 * A basic model for a single metadata property.
 *
 * Implementations of this class can represent...
 * - a metadata entity property (as it was given in the metadata JSON)
 * - a column in a binary property table
 * - a property attribute property in `EXT_structural_metadata`
 * - a property texture property in `EXT_structural_metadata`
 *
 * Usually, the "key" type `K` will be an integer, namely the
 * index for accessing the row of a table. For property texture
 * properties, the key type is `[number,number]`, representing
 * the pixel coordinates.
 *
 * @internal
 */
export interface MetadataPropertyModel<K> {
  /**
   * Returns the property value for the given key.
   *
   * The returned value will include possible offsets, scales, or
   * normalization that are defined by the class property, or that
   * are overridden via the actual metadata property.
   *
   * The type of the returned object depends on the type of
   * the property:
   * - For `ENUM` properties, it will be a `string` containing
   *   the name of the respective enum value (or `undefined`
   *   if the value was not one of the `enum.values[i].value`
   *   values)
   * - For `BOOLEAN` properties, it will be a `boolean`
   * - For `STRING` properties, it will be a `string`
   * - For `SCALAR` properties, it will be a `number` or `bigint`
   * - For `VECn`- or `MATn` properties, it will be an array
   *   of `number`- or `bigint` elements
   * - For array properties, it will be an array of the
   *   respective elements
   *
   * @param key - The key
   * @returns The property value
   */
  getPropertyValue(key: K): any;

  /**
   * Returns the RAW property value for the given key.
   *
   * This value will NOT include possible offsets, scales, or
   * normalization.
   *
   * The type of the returned object depends on the type of
   * the property:
   * - For `ENUM` properties, it will be a the numeric enum
   *   values, which had been given as `enum.values[i].value`
   * - For `BOOLEAN` properties, it will be a `boolean`
   * - For `STRING` properties, it will be a `string`
   * - For `SCALAR` properties, it will be a `number` or `bigint`
   * - For `VECn`- or `MATn` properties, it will be an array
   *   of `number`- or `bigint` elements
   * - For array properties, it will be an array of the
   *   respective elements
   *
   * @param key - The key
   * @returns The raw property value
   */
  getRawPropertyValue(key: K): any;
}

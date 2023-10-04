import { ClassProperty } from "3d-tiles-tools";
import { MetadataValues } from "3d-tiles-tools";

/**
 * A thin wrapper around the accessor data and structural description
 * of a property attribute property, serving as a model (internally)
 * to access the metadata values stored in the property attribute.
 */
export class PropertyAttributePropertyModel {
  /**
   * The data that was obtained from the accessor, in its
   * original form (i.e. including the normalization that
   * maybe part of the accessor itself, but without
   * the offset/scale that may be part of the attribute
   * definition)
   */
  private readonly accessorData: number[] | number[][];

  /**
   * The property attribute property that is represented by this model
   */
  private readonly propertyAttributeProperty: any;

  /**
   * The class property that defines the structure of the property
   */
  private readonly classProperty: ClassProperty;

  /**
   * Creates a new instance
   *
   * @param accessorData - The accessor data
   * @param propertyAttributeProperty - The property attribute property
   * @param classProperty - The class property
   * @param enumValueType - The `valueType` of the enum type of
   * the given class property (or undefined if the class property
   * is not an ENUM)
   * @param valueValueNames - The mapping from enum value values
   * to enum value names for the enum type of the given class
   * property (or an empty dictionary when the class property is
   * not an ENUM)
   */
  constructor(
    accessorData: number[] | number[][],
    propertyAttributeProperty: any,
    classProperty: ClassProperty
  ) {
    this.accessorData = accessorData;
    this.propertyAttributeProperty = propertyAttributeProperty;
    this.classProperty = classProperty;
  }

  /**
   * Returns the size (number of elements) of this model
   *
   * @returns The size
   */
  getSize() {
    return this.accessorData.length;
  }

  /**
   * Returns the property value at the given index
   *
   * The returned value will include possible offsets, scales, or
   * normalization that are defined by the class property, or that
   * are overridden via the property attribute property.
   *
   * The type of the returned object depends on the type of
   * the property:
   * - For `SCALAR` properties, it will be a `number`
   * - For `VECn`- or `MATn` properties, it will be an array
   *   of `number`elements
   *
   * @param index - The index
   * @returns The property value
   */
  getPropertyValue(index: number): number | number[] {
    const propertyAttributeProperty = this.propertyAttributeProperty;
    const classProperty = this.classProperty;

    const offsetOverride = propertyAttributeProperty.offset;
    const scaleOverride = propertyAttributeProperty.scale;

    const value = this.getRawPropertyValue(index);
    const processedValue = MetadataValues.processValue(
      classProperty,
      offsetOverride,
      scaleOverride,
      value
    );
    return processedValue;
  }

  /**
   * Returns the RAW property value at the given index
   *
   * This value will just be the value from the acccessor, and
   * NOT include possible offsets, scales, or normalization.
   *
   * @param index - The index
   * @returns The raw property value
   */
  getRawPropertyValue(index: number): number | number[] {
    const accessorData = this.accessorData;
    return accessorData[index];
  }
}

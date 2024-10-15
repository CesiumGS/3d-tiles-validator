import { ClassProperty } from "3d-tiles-tools";
import { MetadataValues } from "3d-tiles-tools";
import { MetadataPropertyModel } from "../../metadata/MetadataPropertyModel";

/**
 * Implementation of a metadata property model for a
 * property attribute property, backed by glTF accessor
 * data.
 */
export class PropertyAttributePropertyModel
  implements MetadataPropertyModel<number>
{
  /**
   * The data that was obtained from the accessor, in its
   * original form (i.e. including the normalization that
   * may be part of the accessor itself, but without
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

  /** {@inheritDoc MetadataPropertyModel.getPropertyValue} */
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

  /** {@inheritDoc MetadataPropertyModel.getRawPropertyValue} */
  getRawPropertyValue(index: number): number | number[] {
    const accessorData = this.accessorData;
    return accessorData[index];
  }
}

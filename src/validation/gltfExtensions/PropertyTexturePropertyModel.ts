import { ClassProperty } from "3d-tiles-tools";
import { MetadataValues } from "3d-tiles-tools";
import { NumericBuffers } from "3d-tiles-tools";

import { ImageData } from "./ImageData";
import { ImageDataReader } from "./ImageDataReader";

/**
 * A thin wrapper around the image data and structural description
 * of a property texture property, serving as a model (internally)
 * to access the metadata values stored in the property texture.
 *
 * @internal
 *
 * TODO This class requires a lot of special handling for ENUM and
 * BOOLEAN values. There should be a `PropertyTexturePropertyModel`
 * interface, with implementations
 * `NumericPropertyTexturePropertyModel`,
 * `BooleanPropertyTexturePropertyModel`,
 * and `EnumPropertyTexturePropertyModel`.
 */
export class PropertyTexturePropertyModel {
  /**
   * The image data that was read from the glTF texture
   */
  private readonly imageData: ImageData;

  /**
   * The property texture property that is represented by this model
   */
  private readonly propertyTextureProperty: any;

  /**
   * The class property that defines the structure of the property
   */
  private readonly classProperty: ClassProperty;

  /**
   * The value type of the enum that is represented with the
   * given class property, or `undefined` if it is not an enum
   */
  private readonly enumValueType: string | undefined;

  /**
   * The mapping from enum value values to enum value names for
   * the enum type of the given class property (or an empty
   * dictionary when the class property is not an ENUM)
   */
  private readonly enumValueValueNames: { [key: number]: string };

  /**
   * Creates a new instance
   *
   * @param imageData - The image data
   * @param propertyTextureProperty - The property texture property
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
    imageData: ImageData,
    propertyTextureProperty: any,
    classProperty: ClassProperty,
    enumValueType: string | undefined,
    enumValueValueNames: { [key: number]: string }
  ) {
    this.imageData = imageData;
    this.propertyTextureProperty = propertyTextureProperty;
    this.classProperty = classProperty;
    this.enumValueType = enumValueType;
    this.enumValueValueNames = enumValueValueNames;
  }

  /**
   * Returns the size of the texture, in x-direction
   *
   * @returns The size of the texture, in x-direction
   */
  getSizeX() {
    return this.imageData.sizeX;
  }

  /**
   * Returns the size of the texture, in y-direction
   *
   * @returns The size of the texture, in y-direction
   */
  getSizeY() {
    return this.imageData.sizeY;
  }

  /**
   * Returns the property value at the given pixel coordinates.
   *
   * The returned value will include possible offsets, scales, or
   * normalization that are defined by the class property, or that
   * are overridden via the property texture property.
   *
   * The type of the returned object depends on the type of
   * the property:
   * - For `ENUM` properties, it will be a `string` containing
   *   the name of the repsective enum value (or `undefined`
   *   if the value was not one of the `enum.values[i].value`
   *   values)
   * - For `BOOLEAN` properties, it will be a `boolean`
   * - For `ENUM` properties, it will be the numeric value
   *   that corresponds to the respective enum constant.
   * - For `SCALAR` properties, it will be a `number` or `bigint`
   * - For `VECn`- or `MATn` properties, it will be an array
   *   of `number`- or `bigint` elements
   * - For array properties, it will be an array of the
   *   respective elements
   *
   * @param x - The x-coordinate (in pixels)
   * @param y - The y-coordinate (in pixels)
   * @returns The property value
   */
  getPropertyValue(x: number, y: number): any {
    const propertyTextureProperty = this.propertyTextureProperty;
    const classProperty = this.classProperty;

    const offsetOverride = propertyTextureProperty.offset;
    const scaleOverride = propertyTextureProperty.scale;

    const value = this.getRawPropertyValue(x, y);

    if (classProperty.type === "ENUM") {
      const valueNames = this.enumValueValueNames;
      const processedValue = MetadataValues.processNumericEnumValue(
        classProperty,
        valueNames,
        value
      );
      return processedValue;
    }

    const processedValue = MetadataValues.processValue(
      classProperty,
      offsetOverride,
      scaleOverride,
      value
    );
    return processedValue;
  }

  /**
   * Returns the RAW property value at the given pixel coordinates.
   *
   * This value will just be assembled from the channels of the
   * respective pixel, and NOT include possible offsets, scales, or
   * normalization.
   *
   * @param x - The x-coordinate (in pixels)
   * @param y - The y-coordinate (in pixels)
   * @returns The raw property value
   */
  getRawPropertyValue(x: number, y: number): any {
    const propertyTextureProperty = this.propertyTextureProperty;
    const classProperty = this.classProperty;
    const channels = propertyTextureProperty.channels;

    // First, collect the actual values from the image
    // data in a buffer
    const buffer = Buffer.alloc(channels.length);
    for (let c = 0; c < channels.length; c++) {
      const channelValue = ImageDataReader.getChannelValue(
        this.imageData,
        x,
        y,
        c
      );
      buffer.writeUInt8(channelValue & 0xff, c);
    }

    // Handle boolean properties
    if (classProperty.type === "BOOLEAN") {
      // Handle boolean array properties
      if (classProperty.array) {
        // Variable-length arrays are not supported for property
        // textures, so the `count` must be defined here
        const count = classProperty.count!;
        const value = Array<any>(count);
        for (let e = 0; e < count; e++) {
          const element = NumericBuffers.getBooleanFromBuffer(buffer, e);
          value[e] = element;
        }
        return value;
      }

      // Handle boolean (non-array) properties
      const value = NumericBuffers.getBooleanFromBuffer(buffer, 0);
      return value;
    }

    // Handle enum properties
    if (classProperty.type === "ENUM") {
      // The enum value type is assumed to be defined
      // for enum properties
      const enumValueType = this.enumValueType!;

      // Handle enum array properties
      if (classProperty.array) {
        // Variable-length arrays are not supported for property
        // textures, so the `count` must be defined here
        const count = classProperty.count!;
        const value = Array<any>(count);
        for (let e = 0; e < count; e++) {
          const element = NumericBuffers.getNumericFromBuffer(
            buffer,
            e,
            enumValueType
          );
          value[e] = element;
        }
        return value;
      }

      // Handle enum (non-array) properties
      const value = NumericBuffers.getNumericFromBuffer(
        buffer,
        0,
        enumValueType
      );
      return value;
    }

    // Here, the type must be numeric, meaning that
    // the componentType must be defined

    const compoentType = classProperty.componentType!;

    // Handle array properties
    if (classProperty.array) {
      // Variable-length arrays are not supported for property
      // textures, so the `count` must be defined here
      const count = classProperty.count!;
      const value = Array<any>(count);
      for (let e = 0; e < count; e++) {
        const element = NumericBuffers.getNumericFromBuffer(
          buffer,
          e,
          compoentType
        );
        value[e] = element;
      }
      return value;
    }

    // Handle (non-array) properties
    const value = NumericBuffers.getNumericFromBuffer(buffer, 0, compoentType);
    return value;
  }
}

import { ClassProperty } from "3d-tiles-tools";
import { MetadataValues } from "3d-tiles-tools";
import { NumericBuffers } from "3d-tiles-tools";

import { ImageData } from "../ImageData";
import { ImageDataReader } from "../ImageDataReader";

import { MetadataPropertyModel } from "../../metadata/MetadataPropertyModel";

/**
 * Implementation of a MetadataPropertyModel for a single
 * property texture property that contains enum values.
 *
 * @internal
 */
export class PropertyTextureEnumMetadataPropertyModel
  implements MetadataPropertyModel<[number, number]>
{
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
   * given class property
   */
  private readonly enumValueType: string;

  /**
   * The mapping from enum value values to enum value names for
   * the enum type of the given class property
   */
  private readonly enumValueValueNames: { [key: number]: string };

  /**
   * Creates a new instance
   *
   * @param imageData - The image data
   * @param propertyTextureProperty - The property texture property
   * @param classProperty - The class property
   * @param enumValueType - The `valueType` of the enum type of
   * the given class property
   * @param valueValueNames - The mapping from enum value values
   * to enum value names for the enum type of the given class
   * property
   */
  constructor(
    imageData: ImageData,
    propertyTextureProperty: any,
    classProperty: ClassProperty,
    enumValueType: string,
    enumValueValueNames: { [key: number]: string }
  ) {
    this.imageData = imageData;
    this.propertyTextureProperty = propertyTextureProperty;
    this.classProperty = classProperty;
    this.enumValueType = enumValueType;
    this.enumValueValueNames = enumValueValueNames;
  }

  /** {@inheritDoc MetadataPropertyModel.getPropertyValue} */
  getPropertyValue(pixelCoordinates: [number, number]): string | string[] {
    const classProperty = this.classProperty;

    const value = this.getRawPropertyValue(pixelCoordinates);

    const valueNames = this.enumValueValueNames;
    const processedValue = MetadataValues.processNumericEnumValue(
      classProperty,
      valueNames,
      value
    );
    return processedValue;
  }

  /** {@inheritDoc MetadataPropertyModel.getRawPropertyValue} */
  getRawPropertyValue(pixelCoordinates: [number, number]): number | number[] {
    const propertyTextureProperty = this.propertyTextureProperty;
    const classProperty = this.classProperty;
    const channels = propertyTextureProperty.channels;

    // First, collect the actual values from the image
    // data in a buffer
    const x = pixelCoordinates[0];
    const y = pixelCoordinates[1];
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
    const value = NumericBuffers.getNumericFromBuffer(buffer, 0, enumValueType);
    return Number(value);
  }
}

import { ClassProperty } from "3d-tiles-tools";

import { ImageData } from "./ImageData";

import { PropertyTextureNumericMetadataPropertyModel } from "./PropertyTextureMumericMetadataPropertyModel";
import { PropertyTextureBooleanMetadataPropertyModel } from "./PropertyTextureBooleanMetadataPropertyModel";
import { PropertyTextureEnumMetadataPropertyModel } from "./PropertyTextureEnumMetadataPropertyModel";

import { MetadataPropertyModel } from "../metadata/MetadataPropertyModel";

/**
 * Methods to create MetadataPropertyModel instances for
 * property textures.
 */
export class PropertyTextureMetadataPropertyModels {
  /**
   * Creates a new MetadataPropertyModel for the given
   * enum property texture property
   *
   * @param imageData - The image data
   * @param propertyTextureProperty - The property texture property
   * @param classProperty - The class property
   * @param enumValueType - The `valueType` of the enum type of
   * the given class property
   * @param valueValueNames - The mapping from enum value values
   * to enum value names for the enum type of the given class
   * property
   * @returns The resulting model
   */
  static createEnum(
    imageData: ImageData,
    propertyTextureProperty: any,
    classProperty: ClassProperty,
    enumValueType: string,
    enumValueValueNames: { [key: number]: string }
  ): MetadataPropertyModel<[number, number]> {
    return new PropertyTextureEnumMetadataPropertyModel(
      imageData,
      propertyTextureProperty,
      classProperty,
      enumValueType,
      enumValueValueNames
    );
  }

  /**
   * Creates a new MetadataPropertyModel for the given
   * boolean property texture property
   *
   * @param imageData - The image data
   * @param propertyTextureProperty - The property texture property
   * @param classProperty - The class property
   * @returns The resulting model
   */
  static createBoolean(
    imageData: ImageData,
    propertyTextureProperty: any,
    classProperty: ClassProperty
  ): MetadataPropertyModel<[number, number]> {
    return new PropertyTextureBooleanMetadataPropertyModel(
      imageData,
      propertyTextureProperty,
      classProperty
    );
  }

  /**
   * Creates a new MetadataPropertyModel for the given
   * numeric property texture property
   *
   * @param imageData - The image data
   * @param propertyTextureProperty - The property texture property
   * @param classProperty - The class property
   * @returns The resulting model
   */
  static createNumeric(
    imageData: ImageData,
    propertyTextureProperty: any,
    classProperty: ClassProperty
  ): MetadataPropertyModel<[number, number]> {
    return new PropertyTextureNumericMetadataPropertyModel(
      imageData,
      propertyTextureProperty,
      classProperty
    );
  }
}

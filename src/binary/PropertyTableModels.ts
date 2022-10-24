import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";
import { DeveloperError } from "../base/DeveloperError";

import { PropertyTableModel } from "./PropertyTableModel";
import { BinaryPropertyTable } from "./BinaryPropertyTable";
import { BinaryBufferData } from "./BinaryBufferData";
import { BinaryBuffers } from "./BinaryBuffers";

import { Schema } from "../structure/Metadata/Schema";
import { MetadataClass } from "../structure/Metadata/MetadataClass";
import { ClassProperty } from "../structure/Metadata/ClassProperty";
import { PropertyTable } from "../structure/PropertyTable";
import { EnumValue } from "../structure/Metadata/EnumValue";
import { PropertyTableProperty } from "../structure/PropertyTableProperty";
import { MetadataEnum } from "../structure/Metadata/MetadataEnum";

/**
 * Methods to create `PropertyTableModel` instances from individual
 * properties and their associated data.
 *
 * TODO Add proper documentation here!!!
 */
export class PropertyTableModels {
  /**
   * Creates a new `PropertyTableModel` from a single `ClassProperty`
   * and its associated values.
   *
   * @param propertyName The name of the property
   * @param classProperty The actual `ClassProperty`
   * @param values The values for the property
   * @param count The count (number of rows of the table)
   * @returns The `PropertyTableModel`
   */
  static createPropertyTableModelFromProperty(
    propertyName: string,
    classProperty: ClassProperty,
    values: any,
    count: number,
    metadataEnum: MetadataEnum | undefined
  ): PropertyTableModel {
    const binaryPropertyTable =
      PropertyTableModels.createBinaryPropertyTableFromProperty(
        propertyName,
        classProperty,
        values,
        count,
        metadataEnum
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    return propertyTableModel;
  }

  private static createMetadataClassFromClassProperty(
    propertyName: string,
    classProperty: ClassProperty
  ): MetadataClass {
    const classProperties: { [key: string]: ClassProperty } = {};
    classProperties[propertyName] = classProperty;

    const metadataClass: MetadataClass = {
      name: "generatedClass",
      properties: classProperties,
    };
    return metadataClass;
  }

  private static createSchemaFromMetadataClass(
    className: string,
    metadataClass: MetadataClass
  ): Schema {
    const classes: { [key: string]: MetadataClass } = {};
    classes[className] = metadataClass;
    const metadataSchema: Schema = {
      id: "generatedMetadataSchemaId",
      name: "generatedSchema",
      classes: classes,
    };
    return metadataSchema;
  }

  private static createPropertyTableFromProperty(
    className: string,
    propertyName: string,
    count: number,
    propertyTableProperty: PropertyTableProperty
  ): PropertyTable {
    const propertyTableProperties: { [key: string]: PropertyTableProperty } =
      {};
    propertyTableProperties[propertyName] = propertyTableProperty;
    const propertyTable: PropertyTable = {
      name: "generatedPropertyTable",
      class: className,
      count: count,
      properties: propertyTableProperties,
    };
    return propertyTable;
  }

  private static createBinaryPropertyTableFromProperty(
    propertyName: string,
    classProperty: ClassProperty,
    values: any,
    count: number,
    metadataEnum: MetadataEnum | undefined
  ): BinaryPropertyTable {
    const className = "generatedClass";

    const metadataClass =
      PropertyTableModels.createMetadataClassFromClassProperty(
        propertyName,
        classProperty
      );
    const schema = PropertyTableModels.createSchemaFromMetadataClass(
      className,
      metadataClass
    );
    if (defined(metadataEnum)) {
      const enums : { [key: string]: MetadataEnum } = {};
      enums["generatedEnum"] = metadataEnum!;
      schema.enums = enums;
    }
    const createdBufferViewsData: Buffer[] = [];
    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const propertyTableProperty =
      PropertyTableModels.createPropertyTableProperty(
        classProperty,
        schema,
        values,
        arrayOffsetType,
        stringOffsetType,
        createdBufferViewsData
      );

    const propertyTable = PropertyTableModels.createPropertyTableFromProperty(
      className,
      propertyName,
      count,
      propertyTableProperty
    );

    const binaryBufferData: BinaryBufferData = {
      bufferViewsData: [],
      buffersData: [],
    };

    const binaryBufferStructure = BinaryBuffers.createBinaryBufferStructure(
      binaryBufferData,
      createdBufferViewsData
    );

    const enumValueTypes = PropertyTableModels.computeEnumValueTypes(schema);

    const binaryPropertyTable: BinaryPropertyTable = {
      metadataClass: metadataClass,
      propertyTable: propertyTable,
      enumValueTypes: enumValueTypes,
      binaryBufferStructure: binaryBufferStructure,
      binaryBufferData: binaryBufferData,
    };
    return binaryPropertyTable;
  }

  /**
   * Computes a mapping from enum type names to the `valueType` that
   * the respective `MetdataEnum` has (defaulting to `UINT16` if it
   * did not define one)
   * 
   * @param schema The metadata `Schema`
   * @returns The mapping from enum type names to enum value types
   */
  private static computeEnumValueTypes(schema: Schema) : { [key: string]: string } {
    const enumValueTypes : { [key: string]: string } = {};
    const enums = defaultValue(schema.enums, {});
    for (const enumName of Object.keys(enums)) {
      const metadataEnum = enums[enumName];
      const valueType = defaultValue(metadataEnum.valueType, "UINT16");
      enumValueTypes[enumName] = valueType;
    }
    return enumValueTypes;
  }

  /**
   * 
   * @param classProperty The `ClassProperty`
   * @param schema The metadata `Schema`
   * @param values 
   * @param arrayOffsetType 
   * @param stringOffsetType 
   * @param bufferViewsData 
   * @returns 
   */
  private static createPropertyTableProperty(
    classProperty: ClassProperty,
    schema: Schema,
    values: any,
    arrayOffsetType: string,
    stringOffsetType: string,
    bufferViewsData: Buffer[]
  ) : PropertyTableProperty {
    const valuesBuffer = PropertyTableModels.createValuesBuffer(
      classProperty,
      schema,
      values
    );
    const valuesBufferView = bufferViewsData.length;
    bufferViewsData.push(valuesBuffer);

    const propertyTableProperty: PropertyTableProperty = {
      values: valuesBufferView,
      offset: undefined,
      scale: undefined,
      max: undefined,
      min: undefined,
    };

    const isVariableLengthArray =
      classProperty.array && !defined(classProperty.count);
    if (isVariableLengthArray) {
      const arrayOffsetBuffer = PropertyTableModels.createArrayOffsetBuffer(
        values,
        arrayOffsetType
      );
      const arrayOffsetBufferView = bufferViewsData.length;
      bufferViewsData.push(arrayOffsetBuffer);
      propertyTableProperty.arrayOffsets = arrayOffsetBufferView;
    }

    if (classProperty.type === "STRING") {
      const stringOffsetBuffer = PropertyTableModels.createStringOffsetBuffer(
        values,
        stringOffsetType
      );
      const stringOffsetBufferView = bufferViewsData.length;
      bufferViewsData.push(stringOffsetBuffer);
      propertyTableProperty.stringOffsets = stringOffsetBufferView;
    }

    return propertyTableProperty;
  }

  // Parts of the following are ""ported""" from the CesiumJS 'MetadataTester' class at
  // https://github.com/CesiumGS/cesium/blob/b4097de3b8d3d007ed38b3b6fb83717ab6de43ba/Specs/MetadataTester.js
  // A rewrite would have been taken less time and resulted in cleaner code,
  // but it should do what it is supposed to do for now...

  private static toBuffer(arrayBuffer: ArrayBuffer): Buffer {
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
  }

  private static createBuffer(
    values: any,
    componentType: string | undefined
  ): Buffer {
    const buffer = PropertyTableModels.toBuffer(
      PropertyTableModels.createBufferInternal(values, componentType)
    );
    return buffer;
  }

  private static createBufferInternal(
    values: any,
    componentType: string | undefined
  ): ArrayBuffer {
    const flatValues = PropertyTableModels.flattenFully(values);
    switch (componentType) {
      case "INT8":
        return new Int8Array(flatValues).buffer;
      case "UINT8":
        return new Uint8Array(flatValues).buffer;
      case "INT16":
        return new Int16Array(flatValues).buffer;
      case "UINT16":
        return new Uint16Array(flatValues).buffer;
      case "INT32":
        return new Int32Array(flatValues).buffer;
      case "UINT32":
        return new Uint32Array(flatValues).buffer;
      case "INT64":
        return new BigInt64Array(flatValues).buffer;
      case "UINT64":
        return new BigUint64Array(flatValues).buffer;
      case "FLOAT32":
        return new Float32Array(flatValues).buffer;
      case "FLOAT64":
        return new Float64Array(flatValues).buffer;
    }
    throw new DeveloperError(`${componentType} is not a valid component type`);
  }

  private static createStringBuffer(values: any): Buffer {
    return PropertyTableModels.toBuffer(
      PropertyTableModels.createStringBufferInternal(values)
    );
  }

  private static createStringBufferInternal(inputValues: any): Uint8Array {
    const values = PropertyTableModels.flattenFully(inputValues);
    const encoder = new TextEncoder();
    return encoder.encode(values.join(""));
  }

  private static createBooleanBuffer(values: any): Buffer {
    return PropertyTableModels.toBuffer(
      PropertyTableModels.createBooleanBufferInternal(values)
    );
  }

  private static createBooleanBufferInternal(inputValues: any): Uint8Array {
    const values = PropertyTableModels.flattenFully(inputValues);
    const length = Math.ceil(values.length / 8);
    const typedArray = new Uint8Array(length); // Initialized as 0's
    for (let i = 0; i < values.length; ++i) {
      const byteIndex = i >> 3;
      const bitIndex = i % 8;
      if (values[i]) {
        typedArray[byteIndex] |= 1 << bitIndex;
      }
    }
    return typedArray;
  }

  private static flatten(values: any): any {
    return [...values];
  }

  private static flattenFully(values: any): any {
    let result = values;
    if (Array.isArray(result)) {
      result = [];
      for (let i = 0; i < values.length; i++) {
        result = result.concat(PropertyTableModels.flattenFully(values[i]));
      }
    }
    return result;
  }

  private static createValuesBuffer(
    classProperty: ClassProperty,
    schema: Schema,
    values: any
  ): Buffer {
    const type = classProperty.type;
    const componentType = classProperty.componentType;
    const enumType = classProperty.enumType;
    const flattenedValues = PropertyTableModels.flatten(values);

    if (type === "STRING") {
      return PropertyTableModels.createStringBuffer(flattenedValues);
    }

    if (type === "BOOLEAN") {
      return PropertyTableModels.createBooleanBuffer(flattenedValues);
    }

    if (defined(enumType)) {
      const length = flattenedValues.length;
      const metadataEnums = defaultValue(schema.enums, {});
      const metadataEnum = metadataEnums[enumType!];
      const valueNames = metadataEnum.values.map((v: EnumValue) => v.name);
      for (let i = 0; i < length; ++i) {
        const valueName = flattenedValues[i];
        const index = valueNames.indexOf(valueName);
        flattenedValues[i] = index;
      }
    }

    return PropertyTableModels.createBuffer(flattenedValues, componentType);
  }

  private static createStringOffsetBuffer(values: any, offsetType: string) {
    const encoder = new TextEncoder();
    const strings = PropertyTableModels.flattenFully(values);
    const length = strings.length;
    const offsets = new Array(length + 1);
    let offset = 0;
    for (let i = 0; i < length; ++i) {
      offsets[i] = offset;
      offset += encoder.encode(strings[i]).length;
    }
    offsets[length] = offset;
    offsetType = defaultValue(offsetType, "UINT32");
    return PropertyTableModels.createBuffer(offsets, offsetType);
  }

  private static createArrayOffsetBuffer(values: any, offsetType: string) {
    const length = values.length;
    const offsets = new Array(length + 1);
    let offset = 0;
    for (let i = 0; i < length; ++i) {
      offsets[i] = offset;
      offset += values[i].length;
    }
    offsets[length] = offset;
    offsetType = defaultValue(offsetType, "UINT32");
    return PropertyTableModels.createBuffer(offsets, offsetType);
  }
}

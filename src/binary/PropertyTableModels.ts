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
 * Right now, the methods in this class are mainly intended for
 * generating test data. They can be used to create property
 * tables based on single properties and their associated values.
 *
 * When a method expects such `values` to be passed in, then the
 * structure is assumed to be a "JSON-representation" of the data
 * that corresponds to one column of the table:
 *
 * - scalar properties are given as an array of values
 * - properties of structured types (VECn or MATn) are given
 *   as an array of arrays
 * - array properties are given as an array of the aforementioned
 *   inputs.
 *
 * For example:
 * - a string property will be ["row0", "row1"]
 * - a string array property will be
 *   [ ["row0-col0", "row0-col1"],
 *     ["row1-col0", "row1-col1"] ]
 * - a VEC2 property will be [ [0,0], [1,1] ]
 * - a VEC2 array property will be
 *   [ [ [0,0], [0,1], [0,2] ],
 *     [ [1,0], [1,1], [1,2] ] ]
 *
 *
 * TODO Some methods in this class are creating plain JSON
 * structures programmatically (e.g. a Schema that contains
 * a single class with a single property). Some of these
 * methods may be omitted in the future, of if these structures
 * have to be created manually for unit tests anyhow.
 *
 * @private
 */
export class PropertyTableModels {
  /**
   * Creates a new `PropertyTableModel` from a single `ClassProperty`
   * and its associated values.
   *
   * @param propertyName The name of the property
   * @param classProperty The actual `ClassProperty`
   * @param values The values for the property
   * @returns The `PropertyTableModel`
   */
  static createPropertyTableModelFromProperty(
    propertyName: string,
    classProperty: ClassProperty,
    values: any,
    metadataEnum: MetadataEnum | undefined
  ): PropertyTableModel {
    const binaryPropertyTable =
      PropertyTableModels.createBinaryPropertyTableFromProperty(
        propertyName,
        classProperty,
        values,
        metadataEnum
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    return propertyTableModel;
  }

  /**
   * Creates a (dummy) `MetadataClass` that only contains the given property
   *
   * @param propertyName The property name
   * @param classProperty The `ClassProperty`
   * @returns The `MetadataClass`
   */
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

  /**
   * Creates a (dummy) `Schema` that only contains the given class
   *
   * @param className The class name
   * @param metadataClass The `MetadataClass`
   * @returns The metadata `Schema`
   */
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

  /**
   * Creates a `PropertyTable` from the given input.
   *
   * This creates a dummy `PropertyTable` with a single property,
   * which is used for the other methods in this class that can
   * create `BinaryPropertyTable` or `PropertyTableModel` objects
   * from single properties.
   *
   * @param className The class name
   * @param propertyName The property name
   * @param count The count (number of rows) of the table
   * @param propertyTableProperty The `PropertyTableProperty`
   * @returns The `PropertyTable`
   */
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

  /**
   * Creates a `PropertyTableProperty` from the given inputs.
   *
   * This receives the `ClassProperty` itself and the associated values,
   * and generates the `PropertyTableProperty` and its associated
   * binary data. The binary data will include the buffer views for the
   * `values`, `arrayOffsets`, and `stringOffsets`, which will be
   * added to the given `bufferViewsData` array.
   *
   * @param classProperty The `ClassProperty`
   * @param schema The metadata `Schema`. This is only used internally
   * for looking up information about (binary) enum values, if the
   * given property is an ENUM property.
   * @param values The values for the property
   * @param arrayOffsetType The `arrayOffsetType` for the property
   * (only used when the property is a variable-length array)
   * @param stringOffsetType The `stringOffsetType` for the property
   * (only used when the property is a STRING property)
   * @param bufferViewsData The array that will receive the buffer
   * view buffers
   * @returns The `PropertyTableProperty`
   */
  private static createPropertyTableProperty(
    classProperty: ClassProperty,
    schema: Schema,
    values: any,
    arrayOffsetType: string,
    stringOffsetType: string,
    bufferViewsData: Buffer[]
  ): PropertyTableProperty {
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

  /**
   * Creates a `Schema` from the given input.
   *
   * This function is mainly intended for generating test data.
   * It generates a "dummy" schema that only contains a class
   * with the given property, and the given enum.
   *
   * @param propertyName The property name
   * @param classProperty The `ClassProperty`
   * @param metadataEnum The optional `MetadataEnum` when the
   * property is an enum property
   * @returns The schema
   */
  static createSchemaFromClassProperty(
    propertyName: string,
    classProperty: ClassProperty,
    metadataEnum: MetadataEnum | undefined
  ): Schema {
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
      const enums: { [key: string]: MetadataEnum } = {};
      enums["generatedEnum"] = metadataEnum!;
      schema.enums = enums;
    }
    return schema;
  }

  /**
   * Creates a `BinaryPropertyTable` from the given input.
   *
   * This function is mainly intended for generating test data:
   * It receives a predefined `ClassProperty` and associated
   * values, and generates a ("dummy") class, schema, and
   * property table for exactly this single property, together
   * with the associated binary data.
   *
   * @param propertyName The property name
   * @param classProperty The `ClassProperty`
   * @param values The property values
   * @param metadataEnum The optional `MetadataEnum` that defines
   * the (numeric) values that are written into the binary data,
   * based on the (string) values from the `values` parameter
   * @returns The `BinaryPropertyTable`
   */
  static createBinaryPropertyTableFromProperty(
    propertyName: string,
    classProperty: ClassProperty,
    values: any,
    metadataEnum: MetadataEnum | undefined
  ): BinaryPropertyTable {
    const schema = PropertyTableModels.createSchemaFromClassProperty(
      propertyName,
      classProperty,
      metadataEnum
    );
    const className = "generatedClass";
    const binaryPropertyTable = PropertyTableModels.createBinaryPropertyTable(
      schema,
      className,
      propertyName,
      values
    );
    return binaryPropertyTable;
  }

  /**
   * Creates a `BinaryPropertyTable` from the given input.
   *
   * This function is mainly intended for generating test data.
   * It receives information about the property (via the `className`
   * and the `propertyName`, referring to the given schema), and the
   * values for the property, and generates a property table for
   * exactly this single property, together with the associated
   * binary data.
   *
   * @param schema The `Schema`
   * @param className The class name
   * @param propertyName The property name
   * @param values The property values
   * @returns The `BinaryPropertyTable`
   */
  static createBinaryPropertyTable(
    schema: Schema,
    className: string,
    propertyName: string,
    values: any
  ) {
    const classes = defaultValue(schema.classes, {});
    const metadataClass = classes[className];
    const classProperties = defaultValue(metadataClass.properties, {});
    const classProperty = classProperties[propertyName];

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
    const count = values.length;
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
  private static computeEnumValueTypes(schema: Schema): {
    [key: string]: string;
  } {
    const enumValueTypes: { [key: string]: string } = {};
    const enums = defaultValue(schema.enums, {});
    for (const enumName of Object.keys(enums)) {
      const metadataEnum = enums[enumName];
      const valueType = defaultValue(metadataEnum.valueType, "UINT16");
      enumValueTypes[enumName] = valueType;
    }
    return enumValueTypes;
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

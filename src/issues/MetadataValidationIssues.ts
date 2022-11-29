import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to metadata
 */
export class MetadataValidationIssues {
  /**
   * Indicates an invalid byte length in binary metadata.
   *
   * This is used for the case that a buffer view of a property table
   * has a size that does not match the expected size for the data
   * that it should contain.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message of the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static METADATA_INVALID_LENGTH(path: string, message: string) {
    const type = "METADATA_INVALID_LENGTH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the alignment requirements for binary metadata
   * have not been met.
   *
   * This is used when the byte offset of a buffer view is not
   * divisible by the size of the component type.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message of the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static METADATA_INVALID_ALIGNMENT(path: string, message: string) {
    const type = "METADATA_INVALID_ALIGNMENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'arrayOffsets' or 'stringOffsets' in
   * a binary property table property are invalid.
   *
   * This usually means that the offsets are not in ascending order.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message of the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static METADATA_INVALID_OFFSETS(path: string, message: string) {
    const type = "METADATA_INVALID_OFFSETS";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a value that was found in binary metadata is
   * not in the valid range.
   *
   * This means that the value is smaller than the minimum or
   * larger than the maximum, for the minimum/maximum either
   * being defined in the 'class property' or in the 'property
   * table property'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message of the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static METADATA_VALUE_NOT_IN_RANGE(path: string, message: string) {
    const type = "METADATA_VALUE_NOT_IN_RANGE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a value that was found in binary metadata does
   * not match an expected value.
   *
   * This may be used, for example, when the minimum/maximum value
   * that is computed from the values in a property table does not
   * match the minimum/maximum that was defined for that
   * property table property.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message of the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static METADATA_VALUE_MISMATCH(path: string, message: string) {
    const type = "METADATA_VALUE_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a value of a property that was marked as
   * 'required' in the schema was not defined for a metadata
   * entity.
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The name of the property
   * @returns The `ValidationIssue`
   */
  static METADATA_VALUE_REQUIRED_BUT_MISSING(
    path: string,
    propertyName: string
  ) {
    const type = "METADATA_VALUE_REQUIRED_BUT_MISSING";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' is 'required', but ` +
      `no value has been given`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a class property in the metadata schema had
   * a 'semantic' that was not known.
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The name of the property
   * @param semantic - The semantic that was assigned to the property
   * @returns The `ValidationIssue`
   */
  static METADATA_SEMANTIC_UNKNOWN(
    path: string,
    propertyName: string,
    semantic: string
  ) {
    const type = "METADATA_SEMANTIC_UNKNOWN";
    const severity = ValidationIssueSeverity.INFO;
    const message = `The property '${propertyName}' has unknown semantic '${semantic}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a property had a semantic that was not valid for this
   * property.
   *
   * This means that the metadata schema defined a class property with a
   * certain 'semantic'. The 'semantic' was a known semantic, meaning
   * that it was associated with expectations about the property type
   * (e.g. that it should be a 'SCALAR' 'FLOAT32' value), and the
   * property definition did not match the structure that was expected
   * according to the semantic.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message of the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static METADATA_SEMANTIC_INVALID(path: string, message: string) {
    const type = "METADATA_SEMANTIC_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a class property defined a 'componentType', even
   * though the 'type' did not indicate a numeric type.
   *
   * The 'componentType' may only be defined for 'SCALAR', 'VECn',
   * and 'MATn' types.
   *
   * @param path - The path for the `ValidationIssue`
   * @param componentType - The component type
   * @param theType - The type
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_COMPONENT_TYPE_FOR_NON_NUMERIC_TYPE(
    path: string,
    componentType: string,
    theType: string
  ) {
    const type = "CLASS_PROPERTY_COMPONENT_TYPE_FOR_NON_NUMERIC_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The 'componentType' was defined to be '${componentType}', but ` +
      `must be undefined for a property with type '${theType}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a class property did not define a 'componentType',
   * even though the 'type' did indicate a numeric type.
   *
   * The 'componentType' must be defined for 'SCALAR', 'VECn',
   * and 'MATn' types.
   *
   * @param path - The path for the `ValidationIssue`
   * @param theType - The type
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_COMPONENT_TYPE_MISSING(path: string, theType: string) {
    const type = "CLASS_PROPERTY_COMPONENT_TYPE_MISSING";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The 'componentType' must be defined for a ` +
      `property with type '${theType}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a class property defined an 'enumType', even though
   * its 'type' was not 'ENUM'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param enumType - The enumType
   * @param theType - The type
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_ENUMTYPE_WITH_NON_ENUM_TYPE(
    path: string,
    enumType: string,
    theType: string
  ) {
    const type = "CLASS_PROPERTY_ENUMTYPE_WITH_NON_ENUM_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The 'enumType' was defined to be '${enumType}', but ` +
      `must be undefined for a property with type '${theType}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a class property did not define an 'enumType',
   * even though its 'type' was 'ENUM'.
   *
   * @param path - The path for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_ENUM_TYPE_WITHOUT_ENUMTYPE(path: string) {
    const type = "CLASS_PROPERTY_ENUM_TYPE_WITHOUT_ENUMTYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message = `The property has the type 'ENUM', but no 'enumType' was defined`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a class property defined an 'enumType' which was
   * not found in the schema definition.
   *
   * The 'enumType' must be the name of one of the enums that are
   * defined in the 'schema.enums' dictionary.
   *
   * @param path - The path for the `ValidationIssue`
   * @param enumType - The enumType
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_ENUMTYPE_NOT_FOUND(path: string, enumType: string) {
    const type = "CLASS_PROPERTY_ENUMTYPE_NOT_FOUND";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property refers to the 'enumType' to be '${enumType}', ` +
      `but the schema does not define this 'enumType'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a string that was given as an enum value was
   * not found in the enum definition.
   *
   * The valid names for enum values for a class property are defined
   * as the 'schema.enums[classProperty.enumType].values[i].name' values.
   *
   * This issue indicates that a string that was supposed to represent
   * an enum value (e.g. when it was given in a JSON-based metadata
   * entity, or as a 'noData' value of the property) did not appear in
   * this list of valid names.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - The name of the field or property that contained
   * the invalid enum value name (for example, 'noData')
   * @param propertyName - The property name
   * @param enumType - The enumType
   * @param enumValueName - The invalid enum value name
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_ENUM_VALUE_NAME_NOT_FOUND(
    path: string,
    name: string,
    propertyName: string,
    enumType: string | undefined,
    enumValueName: string
  ) {
    const type = "CLASS_PROPERTY_ENUM_VALUE_NAME_NOT_FOUND";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The value '${name}' of property '${propertyName}' refers to a value ` +
      `with the name '${enumValueName}' of the enum '${enumType}', but this ` +
      `enum does not define a value with this name`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'count' property of a class property was
   * defined, even though it was not defined to be an 'array'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The property name
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_COUNT_FOR_NON_ARRAY(
    path: string,
    propertyName: string
  ) {
    const type = "CLASS_PROPERTY_COUNT_FOR_NON_ARRAY";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' defines a 'count', but ` +
      `the property is not an array`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'normalized' property of a class property was
   * truthy, but its 'type' does not allow normalization.
   *
   * Normalization may only be applied when the 'type' is 'SCALAR',
   * 'VECn' or MATn'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The property name
   * @param propertyType - The property type
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE(
    path: string,
    propertyName: string,
    propertyType: string
  ) {
    const type = "CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' is defined to be 'normalized', ` +
      `but the type '${propertyType}' can not be normalized`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'normalized' property of a class property was
   * truthy, but its 'componentType' does not allow normalization.
   *
   * Normalization may only be applied when the 'componentType' is
   * an integer type.
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The property name
   * @param componentType - The component type
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_NORMALIZED_FOR_NON_INTEGER_COMPONENT_TYPE(
    path: string,
    propertyName: string,
    componentType: string
  ) {
    const type = "CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' is defined to be 'normalized', ` +
      `but the component type '${componentType}' is not an integer type`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'offset' or 'scale' property of a class property
   * or property table property was defined, but its type is not effectively
   * a floating point type.
   *
   * A type is 'effectively floating point' when
   * - The 'type' is 'SCALAR', 'VECn', or 'MATn'
   * - AND:
   * -  The 'componentType' is 'FLOATn'
   * -  OR the 'componentType' is an integer type, and 'normalized'
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The property name
   * @param offsetOrScale - The property ('offset' or 'scale')
   * @param propertyType - The property type
   * @param componentType - The component type
   * @param normalized - The value of the 'normalized' property
   * @returns The `ValidationIssue`
   */
  static METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE(
    path: string,
    propertyName: string,
    offsetOrScale: string,
    propertyType: string,
    componentType: string | undefined,
    normalized: boolean | undefined
  ) {
    const type = "METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' is defines '${offsetOrScale}', ` +
      `which is only applicable to properties with types 'SCALAR', ` +
      `'VEC2', 'VEC3', 'VEC4', 'MAT2', 'MAT3', or 'MAT4' when they have ` +
      `component types 'FLOAT32' or 'FLOAT64', or when they are normalized ` +
      `and have component types 'INT8', 'UINT8', 'INT16', 'UINT16', 'INT32', ` +
      `'UINT32', 'INT64', or 'UINT64', but the property has type ` +
      `'${propertyType}' with component type '${componentType}' and ` +
      `'normalized' is '${normalized}`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the 'min' or 'max' property of a class property
   * or property table property was defined, but its type is not a
   * numeric type
   *
   * A type is numeric when the 'type' is 'SCALAR', 'VECn', or 'MATn'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The property name
   * @param minOrMax - The property ('min' or 'max')
   * @param propertyType - The property type
   * @returns The `ValidationIssue`
   */
  static METADATA_MIN_MAX_FOR_NON_NUMERIC_TYPE(
    path: string,
    propertyName: string,
    minOrMax: string,
    propertyType: string
  ) {
    const type = "METADATA_MIN_MAX_FOR_NON_NUMERIC_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' is defines '${minOrMax}', ` +
      `which is only applicable to properties with types 'SCALAR', ` +
      `'VEC2', 'VEC3', 'VEC4', 'MAT2', 'MAT3', or 'MAT4', but the ` +
      `property has type '${propertyType}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates an inconsistency in a class property definition.
   *
   * This indicates that
   * - a 'noData' value was defined for a 'required' property
   * - a 'noData' value was defined for a 'BOOLEAN' property
   * - a 'default' value was defined for a 'required' property
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message of the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTY_INCONSISTENT(path: string, message: string) {
    const type = "CLASS_PROPERTY_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain property was defined for a variable-length
   * array property, but must be undefined for variable-length
   * array properties.
   *
   * This refers to
   * - the 'offset' and 'scale'
   * - the 'min' and 'max'
   * for both a 'class property' and a 'property table property'
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyName - The property name
   * @param invalidPropertyName - The name of the property that should
   * not be present ('min', 'max', 'offset', or 'scale')
   * @returns The `ValidationIssue`
   */
  static METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY(
    path: string,
    propertyName: string,
    invalidPropertyName: string
  ) {
    const type = "METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' defines '${invalidPropertyName}', ` +
      `which is not applicable to variable-length arrays`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain semantic was assigned to multiple properties.
   *
   * The class properties inside a schema may have a certain 'semantic'.
   * But each semantic may only be applied to one property within each
   * class.
   *
   * @param path - The path for the `ValidationIssue`
   * @param propertyNameA - The name of the first property
   * @param propertyNameB - The name of the second property
   * @param semantic - The semantic that was assigned to both properties
   * @returns The `ValidationIssue`
   */
  static CLASS_PROPERTIES_DUPLICATE_SEMANTIC(
    path: string,
    propertyNameA: string,
    propertyNameB: string,
    semantic: string
  ) {
    const type = "CLASS_PROPERTIES_DUPLICATE_SEMANTIC";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The semantic '${semantic}' was assigned to property ` +
      `'${propertyNameA}' and property '${propertyNameB}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain name was used for multiple enum values.
   *
   * The 'enums[e].values[i].name' values must be unique for all 'i'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - The name that appeared more than once
   * @returns The `ValidationIssue`
   */
  static ENUM_VALUE_DUPLICATE_NAME(path: string, name: string) {
    const type = "ENUM_VALUE_DUPLICATE_NAME";
    const severity = ValidationIssueSeverity.ERROR;
    const message = `There enum value name '${name}' is not unique`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain value was used for multiple enum values.
   *
   * The 'enums[e].values[i].value' values must be unique for all 'i'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param value - The value that appeared more than once
   * @returns The `ValidationIssue`
   */
  static ENUM_VALUE_DUPLICATE_VALUE(path: string, value: number) {
    const type = "ENUM_VALUE_DUPLICATE_VALUE";
    const severity = ValidationIssueSeverity.ERROR;
    const message = `There enum value '${value}' is not unique`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}

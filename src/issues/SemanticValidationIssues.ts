import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";
import { ValidationIssueUtils } from "./ValidationIssueUtils";

export class SemanticValidationIssues {
  static ASSET_VERSION_UNKNOWN(path: string, message: string) {
    const type = "ASSET_VERSION_UNKNOWN";
    const severity = ValidationIssueSeverity.WARNING;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static TILE_REFINE_WRONG_CASE(path: string, message: string) {
    const type = "TILE_REFINE_WRONG_CASE";
    const severity = ValidationIssueSeverity.WARNING;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static TILE_IMPLICIT_ROOT_INVALID(path: string, message: string) {
    const type = "TILE_IMPLICIT_ROOT_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static BOUNDING_VOLUME_INCONSISTENT(path: string, message: string) {
    const type = "BOUNDING_VOLUME_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static PROPERTIES_MINIMUM_LARGER_THAN_MAXIMUM(path: string, message: string) {
    const type = "PROPERTIES_MINIMUM_LARGER_THAN_MAXIMUM";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static TILE_GEOMETRIC_ERROR_INCONSISTENT(path: string, message: string) {
    const type = "TILE_GEOMETRIC_ERROR_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static CLASS_PROPERTY_COMPONENT_TYPE_WITH_INVALID_TYPE(
    path: string,
    componentType: string,
    theType: string
  ) {
    const type = "CLASS_PROPERTY_COMPONENT_TYPE_WITH_INVALID_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The 'componentType' was defined to be '${componentType}', but ` +
      `must be undefined for a property with type '${theType}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

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

  static CLASS_PROPERTY_ENUM_TYPE_WITHOUT_ENUMTYPE(path: string) {
    const type = "CLASS_PROPERTY_ENUM_TYPE_WITHOUT_ENUMTYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message = `The property has the type 'ENUM', but no 'enumType' was defined`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static CLASS_PROPERTY_ENUMTYPE_NOT_FOUND(
    path: string,
    propertyName: string,
    enumType: string
  ) {
    const type = "CLASS_PROPERTY_ENUMTYPE_NOT_FOUND";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' refers to the 'enumType' ` +
      `'${enumType}', but the schema does not define this 'enumType'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static CLASS_PROPERTY_VALUE_ENUM_VALUE_NOT_FOUND(
    path: string,
    name: string,
    propertyName: string,
    enumType: string | undefined,
    enumValueName: string
  ) {
    const type = "CLASS_PROPERTY_ENUM_VALUE_NOT_FOUND";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The value '${name}' of property '${propertyName}' refers to a value ` +
      `with the name '${enumValueName}' of the enum '${enumType}', but this ` +
      `enum does not define a value with this name`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

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

  static CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE(
    path: string,
    propertyName: string,
    offsetOrScale: string,
    propertyType: string,
    componentType: string | undefined,
    normalized: boolean | undefined
  ) {
    const type = "CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE";
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

  static CLASS_PROPERTY_MIN_MAX_FOR_NON_NUMERIC_TYPE(
    path: string,
    propertyName: string,
    minOrMax: string,
    propertyType: string
  ) {
    const type = "CLASS_PROPERTY_MIN_MAX_FOR_NON_NUMERIC_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' is defines '${minOrMax}', ` +
      `which is only applicable to properties with types 'SCALAR', ` +
      `'VEC2', 'VEC3', 'VEC4', 'MAT2', 'MAT3', or 'MAT4', but the ` +
      `property has type '${propertyType}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  // TODO Some of the highly specific issues above could be
  // summarized in this one, with helpful messages...
  static CLASS_PROPERTY_TYPE_ERROR(path: string, message: string) {
    const type = "CLASS_PROPERTY_TYPE_ERROR";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

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

  static ENUM_VALUE_DUPLICATE_NAME(path: string, name: string) {
    const type = "ENUM_VALUE_DUPLICATE_NAME";
    const severity = ValidationIssueSeverity.ERROR;
    const message = `There enum value name '${name}' is not unique`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static ENUM_VALUE_DUPLICATE_VALUE(path: string, value: number) {
    const type = "ENUM_VALUE_DUPLICATE_VALUE";
    const severity = ValidationIssueSeverity.ERROR;
    const message = `There enum value '${value}' is not unique`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

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

  static TEMPLATE_URI_INVALID_VARIABLE_NAME(
    path: string,
    variableName: string,
    validVariableNames: string[]
  ) {
    const type = "TEMPLATE_URI_INVALID_VARIABLE_NAME";
    const severity = ValidationIssueSeverity.ERROR;
    const names = ValidationIssueUtils.joinNames("and", ...validVariableNames);
    const message =
      `The template URI refers to the variable '${variableName}', but ` +
      `may only refer to ${names}`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
  static TEMPLATE_URI_MISSING_VARIABLE_NAME(
    path: string,
    missingVVariableNames: string[]
  ) {
    const type = "TEMPLATE_URI_MISSING_VARIABLE_NAME";
    const severity = ValidationIssueSeverity.WARNING;
    const names = ValidationIssueUtils.joinNames(
      "and",
      ...missingVVariableNames
    );
    const message = `The template URI does not use the variable names ${names}`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static SUBTREE_BUFFERS_INCONSISTENT(
    path: string,
    message: string,
  ) {
    const type = "SUBTREE_BUFFERS_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static SUBTREE_AVAILABILITY_INCONSISTENT(
    path: string,
    message: string,
  ) {
    const type = "SUBTREE_AVAILABILITY_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static TRANSFORM_INVALID(
    path: string,
    message: string,
  ) {
    const type = "TRANSFORM_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }


}

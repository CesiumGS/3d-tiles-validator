import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";

import { ClassProperty } from "3d-tiles-tools";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for validations of the `semantic` values of
 * `ClassProperty` objects.
 *
 * @internal
 */
export class ClassPropertySemanticsValidator {
  /**
   * Validate the `semantic` values of the given properties.
   *
   * This assumes that the properties have already been validated
   * with the `ClassPropertyValidator`, ensuring that the `semantic`
   * values are valid strings.
   *
   * @param metadataClassPath - The path for `ValidationIssue` instances
   * @param properties - The properties of the schema class
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateSemantics(
    metadataClassPath: string,
    properties: { [key: string]: ClassProperty },
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate that the 'semantic' of all properties
    // are unique
    const semanticsToPropertyNames: any = {};
    for (const propertyName of Object.keys(properties)) {
      const property = properties[propertyName];
      if (defined(property)) {
        const semantic = property.semantic;
        if (defined(semantic)) {
          const otherPropertyName = semanticsToPropertyNames[semantic];
          if (defined(otherPropertyName)) {
            const issue =
              MetadataValidationIssues.CLASS_PROPERTIES_DUPLICATE_SEMANTIC(
                metadataClassPath,
                propertyName,
                otherPropertyName,
                semantic
              );
            context.addIssue(issue);
            result = false;
          }
          semanticsToPropertyNames[semantic] = propertyName;
        }
      }
    }

    // Validate that the type of the property matches
    // the type that is required via the semantic
    const semanticMatchingSchemas = context.getSemanticMatchingSchemas();
    for (const propertyName of Object.keys(properties)) {
      const property = properties[propertyName];
      if (!defined(property)) {
        continue;
      }
      const semantic = property.semantic;
      if (!defined(semantic)) {
        continue;
      }
      const propertyPath = metadataClassPath + "/properties/" + propertyName;

      // Find the "matcher" for the given semantic. This is just
      // the "property" in the `matchingSchema` whose name is
      // the same as the `semantic`. If no matcher is found for
      // the given semantic, a warning will be created
      const semanticMatcher =
        ClassPropertySemanticsValidator.findSemanticMatcher(
          semanticMatchingSchemas,
          semantic
        );
      if (!defined(semanticMatcher)) {
        const issue = MetadataValidationIssues.METADATA_SEMANTIC_UNKNOWN(
          propertyPath,
          propertyName,
          semantic
        );
        context.addIssue(issue);
      } else {
        // Check whether the structure of the property
        // matches the one required by the matcher
        if (
          !ClassPropertySemanticsValidator.validateSemantic(
            propertyPath,
            propertyName,
            property,
            semantic,
            semanticMatcher,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // TODO The constraints for the values that are imposed
    // by the semantics are not validated yet. For example,
    // this should apply the `BoundingVolumeValidator` to
    // properties with the TILE_BOUNDING_REGION, or check
    // that TILE_REFINE only has a value of 0 or 1.

    return result;
  }

  /**
   * Validate that the type of the given property matches the
   * requirements that are defined by the given matcher.
   *
   * For information about the 'semanticMatcher', see createMatchingSchema.
   *
   * @param propertyPath - The path for `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param property - The `ClassProperty`
   * @param semantic - The `semantic`
   * @param semanticMatcher - The semantic matcher
   * @param context - The `ValidationContext`
   * @returns Whether the property type matched the structure
   * that is defined by the given matcher
   */
  private static validateSemantic(
    propertyPath: string,
    propertyName: string,
    property: ClassProperty,
    semantic: string,
    semanticMatcher: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    if (property.type !== semanticMatcher.type) {
      const message =
        `Property '${propertyName}' has semantic '${semantic}', ` +
        `which requires type '${semanticMatcher.type}', but the ` +
        `property has type '${property.type}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    if (defined(semanticMatcher.componentType)) {
      const componentType = defaultValue(property.componentType, "undefined");
      const regex = new RegExp("^" + semanticMatcher.componentType + "$");
      if (!regex.test(componentType)) {
        const message =
          `Property '${propertyName}' has semantic '${semantic}', ` +
          `which requires the component type to match ` +
          `'${semanticMatcher.componentType}', but the ` +
          `property has component type '${componentType}'`;
        const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
          propertyPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }
    const matcherArray = defaultValue(semanticMatcher.array, false);
    const propertyArray = defaultValue(property.array, false);
    if (propertyArray !== matcherArray) {
      const message =
        `Property '${propertyName}' has semantic '${semantic}', ` +
        `which requires the 'array' property to be '${matcherArray}' ` +
        `but the 'array' property is '${property.array}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    if (property.array === true) {
      if (property.count !== semanticMatcher.count) {
        const message =
          `Property '${propertyName}' has semantic '${semantic}', which ` +
          `requires the 'count' property to be '${semanticMatcher.count}' ` +
          `but the 'count' property is '${property.count}'`;
        const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
          propertyPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    const matcherNormalized = defaultValue(semanticMatcher.normalized, false);
    const propertyNormalized = defaultValue(property.normalized, false);
    if (propertyNormalized !== matcherNormalized) {
      const message =
        `Property '${propertyName}' has semantic '${semantic}', which ` +
        `requires the 'normalized' property to be '${matcherNormalized}' ` +
        `but the 'normalized' property is '${property.normalized}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    // There currently are no semantics that involve an `enumType`,
    // but the check is done here for completeness
    if (property.enumType !== semanticMatcher.enumType) {
      const message =
        `Property '${propertyName}' has semantic '${semantic}', ` +
        `which requires enumType '${semanticMatcher.enumType}', but the ` +
        `property has enumType '${property.enumType}'`;
      const issue = MetadataValidationIssues.METADATA_SEMANTIC_INVALID(
        propertyPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    return result;
  }

  /**
   * Finds a "matcher" for the specified semantic in the given matching schemas.
   *
   * The given semantic is just the name of the semantic. This is used as a
   * property name in the matching schema. The classes in the given schemas are
   * searched for a property that has this (semantic) name. If such a
   * "matching property" is found, it is returned, and used for checking if
   * the property that contained the given semantic matches the "matching property".
   *
   * Ideally, comparing this "matching property" and the actual property should
   * check whether the `type`, `component`, and `array` of the matching property
   * are equal to these in the actual property. But given that semantics may
   * have different `componentType` values, the returned property may define
   * the `componentType` to be a RegEx that the actual component type must
   * match against.
   *
   * @param matchingSchema - The matching metadata schema to search for semantics
   * @param semantic - The name of the semantic
   * @returns The matcher, or `undefined`
   */
  private static findSemanticMatcher(
    matchingSchemas: any,
    semantic: string
  ): any {
    for (const matchingSchema of matchingSchemas) {
      const matchingClasses = defaultValue(matchingSchema.classes, {});
      for (const className of Object.keys(matchingClasses)) {
        const matchingClass = matchingClasses[className];
        const matchingProperties = defaultValue(matchingClass.properties, {});
        for (const semanticName of Object.keys(matchingProperties)) {
          if (semanticName === semantic) {
            return matchingProperties[semanticName];
          }
        }
      }
    }
    return undefined;
  }
}

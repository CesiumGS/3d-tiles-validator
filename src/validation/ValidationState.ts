import { Schema } from "3d-tiles-tools";
import { Group } from "3d-tiles-tools";

/**
 * Preliminary:
 *
 * A class that summarizes state information about the validation
 * of a tileset. It contains information about the state of the
 * validation of various components that is required to selectively
 * perform or skip other validation steps.
 *
 * @internal
 */
export type ValidationState = {
  /**
   * Whether there was a `tileset.schema` or `tileset.schemaUri`.
   *
   * Note that the `validatedSchema` may still be `undefined`.
   *
   * See `validatedSchema` for details!
   */
  hasSchemaDefinition: boolean;

  /**
   * The `Schema`.
   *
   * This can either be the `tileset.schema`, or the schema that
   * has been resolved from the `tileset.schemaUri`.
   *
   * When this is `undefined`, then this can mean different things:
   * 1. The tileset did not define a `schema` or `schemaUri`
   * 2. The tileset had a `schemaUri`, but this file could not
   *    be resolved or parsed
   * 3. There was a `tileset.schema` or `tileset.schemaUri`,
   *    but the respective schema was not valid
   *
   * The validation will report the case that the schema could not
   * be resolved or parsed as an `IO_ERROR` or `JSON_PARSE_ERROR`.
   * The case that the schema is invalid will be reported as
   * a specific validation error.
   * But in either of these cases, subsequent validation steps
   * should not attempt to perform validations that require
   * a valid schema. Therefore, the `validatedSchema` may be
   * `undefined` even when `hasSchemaDefinition` is `true`.
   */
  validatedSchema?: Schema;

  /**
   * Whether there was a `tileset.groups` definition.
   *
   * Note that the `validatedGroups` may still be `undefined`.
   * when the `tileset.groups` turned out to be invalid in
   * any way.
   */
  hasGroupsDefinition: boolean;

  /**
   * The `Groups[]` from the `tileset.groups` definition.
   *
   * The `validatedGroups` may be `undefined` even when
   * `hasGroupsDefinition` is `true`, namely when the
   * groups definition could not be validated.
   */
  validatedGroups?: Group[];
};

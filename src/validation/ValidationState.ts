import { Schema } from "@3d-tiles-tools/structure";
import { Group } from "@3d-tiles-tools/structure";

import { ValidatedElement } from "./ValidatedElement";

/**
 * A class that summarizes state information about the validation
 * of a tileset. It contains information about the state of the
 * validation of various components that is required to selectively
 * perform or skip other validation steps.
 *
 * @internal
 */
export type ValidationState = {
  /**
   * The state describing the validation of the metadata schema
   */
  schemaState: ValidatedElement<Schema>;

  /**
   * The state describing the validation of the groups
   */
  groupsState: ValidatedElement<Group[]>;
};

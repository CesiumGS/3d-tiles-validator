import { defined } from "3d-tiles-tools";

import { ValidationOptions } from "./ValidationOptions";
import { ContentData } from "3d-tiles-tools";
import { ContentDataTypeRegistry } from "3d-tiles-tools";

/**
 * A class for checking the settings that are stored
 * in a `ValidationOptions` object, and determine
 * whether (and how) certain validation steps should
 * be performed.
 *
 * @internal
 */
export class ValidationOptionChecks {
  /**
   * Examines the given validation options, to see whether the given
   * content data should be validated.
   *
   * @param options - The validation options
   * @param contentData - The content data
   * @returns Whether the content data should be validated
   */
  static async shouldValidate(
    options: ValidationOptions,
    contentData: ContentData
  ): Promise<boolean> {
    if (!options.validateContentData) {
      return false;
    }
    const name = await ContentDataTypeRegistry.findContentDataType(contentData);
    if (!defined(name)) {
      return false;
    }
    let isIncluded = true;
    let isExcluded = false;
    const included = options.includeContentTypes;
    if (defined(included)) {
      isIncluded = included.includes(name);
    }
    const excluded = options.excludeContentTypes;
    if (defined(excluded)) {
      isExcluded = excluded.includes(name);
    }
    return isIncluded && !isExcluded;
  }
}

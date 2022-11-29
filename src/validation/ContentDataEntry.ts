import { Validator } from "./Validator";
import { ContentData } from "./ContentData";

/**
 * An entry of the registered content data validators,
 * used in the `ContentDataValidators`.
 *
 * @internal
 */
export type ContentDataEntry = {
  /**
   * A predicate that determines - for a given `ContentData` -
   * whether the `dataValidator` should be used to validate
   * the content data.
   */
  predicate: (contentData: ContentData) => Promise<boolean>;

  /**
   * The `Validator` that will be applied to the content
   * data when the predicate matches a given `ContentData`
   * object.
   */
  dataValidator: Validator<ContentData>;
};

import { ValidationContext } from "../ValidationContext";
import { ValidationIssue } from "../ValidationIssue";
import { GltfData } from "./GltfData";

/**
 * An internal type definition for glTF extension validators.
 *
 * Instances of this interface will be registered in the
 * GltfExtensionValidators class.
 *
 * The GltfValidator will perfom the validation of glTF data in two
 * steps:
 *
 * 1. It will call the 'glTF-Validator' and convert its issues
 * into 'ValidationIssue' instances. These issues are then passed
 * to the 'processIssues' method of all implementations of this
 * interface. This will remove all issues that are considered to
 * be obsolete due to the validation that is later performed by
 * the 'validate' method.
 *
 * 2. If there are no 'ERROR' issues reported by the glTF validator,
 * then the GltfValidator will pass the glTF data to the 'validate'
 * method if all implementations of this interface, to check
 * whether the respective extension is valid.
 *
 *
 * @internal
 */
export interface GltfExtensionValidator {
  /**
   * Performs the validation of a glTF extension in a given GltfData
   * object.
   *
   * This adds any issues to the given context, and returns
   * whether the extension was valid.
   *
   * @param path - The path for validation issues
   * @param gltfData - The GltfData object
   * @param context - The validation context
   * @returns Whether the extension was valid
   */
  validate(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean>;

  /**
   * Process the given list of validation issues, based on the knowledge
   * that only this validator implementation has.
   *
   * The given list are the validation issues that have been created
   * from the validation issues of the glTF validator (possibly processed
   * from other GltfExtensionValidator implementations).
   *
   * This method can omit some of these issues, if it determines that the
   * respective issue is obsolete due to the validation that is performed
   * by this instance. For example, all implementations of this interface
   * will remove the issue where the message is
   * "Cannot validate an extension as it is not supported by the validator:"
   * followed by the name of the extension that this validator is
   * responsible for. (Note that the method can also add new issues, but
   * this is usually supposed to be done in the 'validate' method)
   *
   * @param path - The path for validation issues
   * @param gltfData - The GltfData objects
   * @param causes - The validation issues
   */
  processCauses(
    path: string,
    gltfData: GltfData,
    causes: ValidationIssue[]
  ): Promise<ValidationIssue[]>;
}

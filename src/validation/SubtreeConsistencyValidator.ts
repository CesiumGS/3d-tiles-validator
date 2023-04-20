import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { Subtree } from "3d-tiles-tools";
import { Availability } from "3d-tiles-tools";
import { TileImplicitTiling } from "3d-tiles-tools";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

import { ImplicitTilings } from "3d-tiles-tools";
import { BinaryBufferStructureValidator } from "./BinaryBufferStructureValidator";
import { BinaryBufferStructure } from "3d-tiles-tools";

/**
 * A class for the validation of the consistency of subtrees.
 *
 * The functions in this class are supposed to be called after the
 * basic validity has been checked with the `SubtreeValidator`.
 *
 * They perform the validity checks for the buffer data layout
 * and availability data, referring to the information that is
 * given in the `TileImplicitTiling` structure.
 *
 * They will **NOT** analyze the actual buffer data.
 *
 * @internal
 */
export class SubtreeConsistencyValidator {
  /**
   * Perform basic consistency validation on the given subtree object.
   *
   * This assumes that the basic (JSON-level) structural validations
   * have already been performed. It will only validate the consistency
   * of the memory layout of buffer views, buffers, and the availability
   * information.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param subtree - The `Subtree` object
   * @param implicitTiling - The `TileImplicitTiling` object. If this
   * is not given, then the validation of the availability information
   * (that requires information about the subtree structure) will be
   * skipped
   * @param context - The `ValidationCondext`
   * @returns Whether the data was consistent
   */
  static validateSubtreeConsistency(
    path: string,
    subtree: Subtree,
    implicitTiling: TileImplicitTiling | undefined,
    context: ValidationContext
  ): boolean {
    // Only if the buffers and buffer views have been valid
    // on the JSON level, validate their consistency
    // in terms of memory layout
    const binaryBufferStructure: BinaryBufferStructure = {
      buffers: subtree.buffers ?? [],
      bufferViews: subtree.bufferViews ?? [],
    };
    if (
      !BinaryBufferStructureValidator.validateBinaryBufferStructureConsistency(
        path,
        binaryBufferStructure,
        context
      )
    ) {
      return false;
    }

    if (defined(implicitTiling)) {
      if (
        !SubtreeConsistencyValidator.validateSubtreeAvailabilityConsistency(
          path,
          subtree,
          implicitTiling,
          context
        )
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Performs the consistency checks for the `tileAvailability`,
   * `contentAvailability` and `childSubtreeAvailability` objects
   * in the given subtree.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param subtree - The `Subtree` object
   * @param implicitTiling - The `TileImplicitTiling` that defines the
   * subtree structure
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateSubtreeAvailabilityConsistency(
    path: string,
    subtree: Subtree,
    implicitTiling: TileImplicitTiling,
    context: ValidationContext
  ): boolean {
    let result = true;

    // The implicitTiling has already been validated to have a valid
    // subvisionScheme. Therefore, the methods from `ImplicitTilings`
    // should never throw an `ImplicitTilingError` here.

    // Validate the consistency of the tileAvailability
    const tileAvailability = subtree.tileAvailability;
    const tileAvailabilityPath = path + "/tileAvailability";

    const tileAvailabilityRequiredLengthInBits =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling);
    if (
      !SubtreeConsistencyValidator.validateAvailabilityConsistency(
        tileAvailabilityPath,
        tileAvailability,
        tileAvailabilityRequiredLengthInBits,
        subtree,
        implicitTiling,
        context
      )
    ) {
      result = false;
    }

    // Validate the consistency of the contentAvailability
    const contentAvailability = subtree.contentAvailability;
    const contentAvailabilityPath = path + "/contentAvailability";
    const contentAvailabilityRequiredLengthInBits =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling);
    if (defined(contentAvailability)) {
      // Validate the consistency of each contentAvailability
      for (let i = 0; i < contentAvailability.length; i++) {
        const elementPath = contentAvailabilityPath + "/" + i;
        const element = contentAvailability[i];
        if (
          !SubtreeConsistencyValidator.validateAvailabilityConsistency(
            elementPath,
            element,
            contentAvailabilityRequiredLengthInBits,
            subtree,
            implicitTiling,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the consistency of the childSubtreeAvailability
    const childSubtreeAvailability = subtree.childSubtreeAvailability;
    const childSubtreeAvailabilityPath = path + "/childSubtreeAvailability";
    const childSubtreeAvailabilityRequiredLengthInBits =
      ImplicitTilings.computeNumberOfNodesInLevel(
        implicitTiling,
        implicitTiling.subtreeLevels
      );
    if (
      !SubtreeConsistencyValidator.validateAvailabilityConsistency(
        childSubtreeAvailabilityPath,
        childSubtreeAvailability,
        childSubtreeAvailabilityRequiredLengthInBits,
        subtree,
        implicitTiling,
        context
      )
    ) {
      result = false;
    }
    return result;
  }

  /**
   * Perform the consistency checks for the given availability object.
   *
   * This will check whether the object refers to a valid buffer view,
   * and the buffer view has a length that is sufficient for the
   * respective availability information.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param availability - The `Availability` object
   * @param requiredLengthInBits - The length, in bits, that is required
   * for storing the given availability information
   * @param subtree - The `Subtree` object
   * @param implicitTiling - The `TileImplicitTiling` that defines the
   * subtree structure
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAvailabilityConsistency(
    path: string,
    availability: Availability,
    requiredLengthInBits: number,
    subtree: Subtree,
    implicitTiling: TileImplicitTiling,
    context: ValidationContext
  ): boolean {
    let result = true;

    const bufferViews = defaultValue(subtree.bufferViews, []);

    // Validate the bitstream
    const bitstream = availability.bitstream;
    const bitstreamPath = path + "/bitstream";
    if (defined(bitstream)) {
      // The bitstream (index) MUST be smaller than the number of bufferViews
      if (
        !BasicValidator.validateIntegerRange(
          bitstreamPath,
          "bitstream",
          bitstream,
          0,
          true,
          bufferViews.length,
          false,
          context
        )
      ) {
        result = false;
      } else {
        // The required length in bits MUST fit into the bufferView
        const bufferView = bufferViews[bitstream];
        const requiredLengthInBytes = Math.ceil(requiredLengthInBits / 8);
        if (requiredLengthInBytes !== bufferView.byteLength) {
          const subtreeLevels = implicitTiling.subtreeLevels;
          const subdivisionScheme = implicitTiling.subdivisionScheme;
          const message =
            `The availability for ${subtreeLevels} levels in a subtree ` +
            `with subdivision scheme ${subdivisionScheme} ` +
            `requires ${requiredLengthInBits} bits (${requiredLengthInBytes} ` +
            `bytes), but the bitstream ${bitstream} refers to a buffer view ` +
            `that has a byte length of ${bufferView.byteLength}`;
          const issue =
            SemanticValidationIssues.SUBTREE_AVAILABILITY_INCONSISTENT(
              path,
              message
            );
          context.addIssue(issue);
          result = false;
        }
      }
    }

    return result;
  }
}

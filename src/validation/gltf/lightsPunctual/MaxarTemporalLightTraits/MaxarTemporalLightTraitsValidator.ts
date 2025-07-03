import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../../ValidationContext";
import { BasicValidator } from "../../../BasicValidator";

import { GltfExtensionValidationIssues } from "../../../../issues/GltfExtensionValidationIssues";

/**
 * A class for validating the `MAXAR_temporal_light_traits` extension
 * that extends `KHR_lights_punctual` lights.
 *
 * @internal
 */
export class MaxarTemporalLightTraitsValidator {
  /**
   * Validates the MAXAR_temporal_light_traits extension
   *
   * @param path - The path for validation issues
   * @param extension - The temporal light traits extension object
   * @param context - The validation context
   * @returns Whether the extension is valid
   */
  static validateTemporalLightTraits(
    path: string,
    extension: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "MAXAR_temporal_light_traits",
        extension,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the flashing property (optional)
    const flashing = extension.flashing;
    if (defined(flashing)) {
      if (
        !MaxarTemporalLightTraitsValidator.validateFlashing(
          path + "/flashing",
          flashing,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates a flashing trait object
   *
   * @param path - The path for validation issues
   * @param flashing - The flashing object
   * @param context - The validation context
   * @returns Whether the flashing trait is valid
   */
  private static validateFlashing(
    path: string,
    flashing: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "flashing", flashing, context)) {
      return false;
    }

    let result = true;

    // Validate the waveform property (required)
    const waveform = flashing.waveform;
    if (!defined(waveform)) {
      const message = "The 'waveform' property is required";
      const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      const validWaveforms = ["sine", "square", "triangle"];
      if (typeof waveform !== "string" || !validWaveforms.includes(waveform)) {
        const message = `The 'waveform' property must be one of: ${validWaveforms.join(
          ", "
        )}`;
        const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
          path + "/waveform",
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the frequency property (required)
    const frequency = flashing.frequency;
    if (!defined(frequency)) {
      const message = "The 'frequency' property is required";
      const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      if (typeof frequency !== "number" || frequency <= 0) {
        const message = "The 'frequency' property must be a positive number";
        const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
          path + "/frequency",
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the duty property (optional)
    const duty = flashing.duty;
    if (defined(duty)) {
      if (typeof duty !== "number" || duty < 0.0 || duty > 1.0) {
        const message =
          "The 'duty' property must be a number between 0.0 and 1.0";
        const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
          path + "/duty",
          message
        );
        context.addIssue(issue);
        result = false;
      }

      // Validate that duty is only used with square waveforms
      if (defined(waveform) && waveform !== "square") {
        const message =
          "The 'duty' property is only applicable for 'square' waveforms";
        const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
          path + "/duty",
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the amplitudeOffset property (optional)
    const amplitudeOffset = flashing.amplitudeOffset;
    if (defined(amplitudeOffset)) {
      if (typeof amplitudeOffset !== "number") {
        const message = "The 'amplitudeOffset' property must be a number";
        const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
          path + "/amplitudeOffset",
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the amplitudeScale property (optional)
    const amplitudeScale = flashing.amplitudeScale;
    if (defined(amplitudeScale)) {
      if (typeof amplitudeScale !== "number") {
        const message = "The 'amplitudeScale' property must be a number";
        const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
          path + "/amplitudeScale",
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the phaseOffset property (optional)
    const phaseOffset = flashing.phaseOffset;
    if (defined(phaseOffset)) {
      if (typeof phaseOffset !== "number") {
        const message = "The 'phaseOffset' property must be a number";
        const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
          path + "/phaseOffset",
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    return result;
  }
}

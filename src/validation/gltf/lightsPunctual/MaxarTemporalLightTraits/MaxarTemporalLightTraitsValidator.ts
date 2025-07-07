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
    const validWaveforms = ["sine", "square", "triangle"];
    if (
      !BasicValidator.validateEnum(
        path + "/waveform",
        "waveform",
        waveform,
        validWaveforms,
        context
      )
    ) {
      result = false;
    }

    // Validate the frequency property (required)
    const frequency = flashing.frequency;
    if (
      !BasicValidator.validateNumberRange(
        path + "/frequency",
        "frequency",
        frequency,
        0.0,
        false,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the duty property (optional)
    const duty = flashing.duty;
    if (defined(duty)) {
      if (
        !BasicValidator.validateNumberRange(
          path + "/duty",
          "duty",
          duty,
          0.0,
          true,
          1.0,
          true,
          context
        )
      ) {
        result = false;
      }

      // Validate that duty is only used with square waveforms
      if (waveform !== "square") {
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
      if (
        !BasicValidator.validateNumber(
          path + "/amplitudeOffset",
          "amplitudeOffset",
          amplitudeOffset,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the amplitudeScale property (optional)
    const amplitudeScale = flashing.amplitudeScale;
    if (defined(amplitudeScale)) {
      if (
        !BasicValidator.validateNumber(
          path + "/amplitudeScale",
          "amplitudeScale",
          amplitudeScale,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the phaseOffset property (optional)
    const phaseOffset = flashing.phaseOffset;
    if (defined(phaseOffset)) {
      if (
        !BasicValidator.validateNumber(
          path + "/phaseOffset",
          "phaseOffset",
          phaseOffset,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}

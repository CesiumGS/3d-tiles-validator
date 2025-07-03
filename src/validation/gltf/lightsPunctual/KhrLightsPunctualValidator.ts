import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";
import { GltfData } from "../GltfData";

import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";
import { MaxarTemporalLightTraitsValidator } from "./MaxarTemporalLightTraits/MaxarTemporalLightTraitsValidator";

/**
 * A class for validating the `MAXAR_temporal_light_traits` extension
 * that extends `KHR_lights_punctual` lights in glTF assets.
 *
 * This validator only validates MAXAR_temporal_light_traits extensions
 * and assumes that KHR_lights_punctual structure validation is handled
 * by the glTF Validator.
 *
 * @internal
 */
export class KhrLightsPunctualValidator {
  /**
   * Performs the validation to ensure that the `MAXAR_temporal_light_traits`
   * extensions in KHR_lights_punctual lights are valid
   *
   * @param path - The path for validation issues
   * @param gltfData - The glTF data, containing the parsed JSON and the
   * (optional) binary buffer
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateGltf(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    const gltf = gltfData.gltf;

    // Check if KHR_lights_punctual extension is used
    const extensionsUsed = gltf.extensionsUsed;
    if (!extensionsUsed || !extensionsUsed.includes("KHR_lights_punctual")) {
      return true; // Extension not used, nothing to validate
    }

    // Check if MAXAR_temporal_light_traits is also used
    const hasTemporalTraits = extensionsUsed.includes(
      "MAXAR_temporal_light_traits"
    );

    let result = true;

    // Get the root extension to find lights array
    const rootExtensions = gltf.extensions;
    let lightsPunctual = undefined;
    if (defined(rootExtensions)) {
      lightsPunctual = rootExtensions["KHR_lights_punctual"];
    }

    // Validate MAXAR_temporal_light_traits extensions in lights
    // We need to check all lights regardless of whether MAXAR_temporal_light_traits
    // is declared in extensionsUsed, to catch undeclared usage
    if (defined(lightsPunctual) && defined(lightsPunctual.lights)) {
      const lights = lightsPunctual.lights;
      for (let i = 0; i < lights.length; i++) {
        const light = lights[i];
        const lightPath = path + "/extensions/KHR_lights_punctual/lights/" + i;
        if (
          !KhrLightsPunctualValidator.validateLightTemporalTraits(
            lightPath,
            light,
            hasTemporalTraits,
            context
          )
        ) {
          result = false;
        }
      }
    }

    return result;
  }

  /**
   * Validates MAXAR_temporal_light_traits extensions in a light object
   *
   * @param path - The path for validation issues
   * @param light - The light object
   * @param hasTemporalTraits - Whether MAXAR_temporal_light_traits extension is used
   * @param context - The validation context
   * @returns Whether the light temporal traits are valid
   */
  private static validateLightTemporalTraits(
    path: string,
    light: any,
    hasTemporalTraits: boolean,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "light", light, context)) {
      return false;
    }

    let result = true;

    // Validate MAXAR_temporal_light_traits extension if present
    const extensions = light.extensions;
    if (defined(extensions)) {
      const temporalTraits = extensions["MAXAR_temporal_light_traits"];
      if (defined(temporalTraits)) {
        if (!hasTemporalTraits) {
          const message =
            "MAXAR_temporal_light_traits extension is used but not declared in extensionsUsed";
          const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
            path + "/extensions/MAXAR_temporal_light_traits",
            message
          );
          context.addIssue(issue);
          result = false;
        } else {
          const temporalTraitsPath =
            path + "/extensions/MAXAR_temporal_light_traits";
          if (
            !MaxarTemporalLightTraitsValidator.validateTemporalLightTraits(
              temporalTraitsPath,
              temporalTraits,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    return result;
  }
}

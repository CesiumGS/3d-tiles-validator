import fs from "fs";
import path from "path";

import { ResourceResolvers } from "3d-tiles-tools";

import { ValidationContext } from "../../src/validation/ValidationContext";

import { GltfExtensionValidators } from "../../src/validation/gltf/GltfExtensionValidators";

export async function validateGltf(gltfFileName: string) {
  fs.readFileSync(gltfFileName);

  const directory = path.dirname(gltfFileName);
  const fileName = path.basename(gltfFileName);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const context = new ValidationContext(directory, resourceResolver);
  const gltfFileData = await resourceResolver.resolveData(fileName);
  if (gltfFileData) {
    await GltfExtensionValidators.validateGltfExtensions(
      gltfFileName,
      gltfFileData,
      context
    );
  }
  const validationResult = context.getResult();
  return validationResult;
}

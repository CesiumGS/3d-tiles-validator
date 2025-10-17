import fs from "fs";
import path from "path";

import { ResourceResolvers } from "3d-tiles-tools";

import { ValidationContext } from "../../src/validation/ValidationContext";

import { GltfExtensionValidators } from "../../src/validation/gltf/GltfExtensionValidators";
import { GltfDataReader } from "../../src/validation/gltf/GltfDataReader";

export async function validateGltf(gltfFileName: string) {
  fs.readFileSync(gltfFileName);

  const directory = path.dirname(gltfFileName);
  const fileName = path.basename(gltfFileName);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const context = new ValidationContext(directory, resourceResolver);
  const gltfFileData = await resourceResolver.resolveData(fileName);
  if (gltfFileData) {
    const gltfData = await GltfDataReader.readGltfData(
      gltfFileName,
      gltfFileData,
      context
    );
    if (gltfData) {
      await GltfExtensionValidators.validateGltfExtensions(
        gltfFileName,
        gltfData,
        context
      );
    }
  }
  const validationResult = context.getResult();
  return validationResult;
}

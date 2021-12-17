import { Gltf } from "./gltfType";

/**
 * Initializes root level properties in a glTF asset to an empty array
 * if they do not exist already.
 * @param gltf The glTF asset to modify.
 */
export function initalizeGltf(gltf: Gltf) {
    gltf.accessors = gltf.accessors == null ? [] : gltf.accessors;
    gltf.bufferViews = gltf.bufferViews == null ? [] : gltf.bufferViews;
    gltf.meshes = gltf.meshes == null ? [] : gltf.meshes;
    gltf.textures = gltf.textures == null ? [] : gltf.textures;
    gltf.images = gltf.images == null ? [] : gltf.images;
    gltf.textures = gltf.textures == null ? [] : gltf.textures;
    gltf.samplers = gltf.samplers == null ? [] : gltf.samplers;
    gltf.materials = gltf.materials == null ? [] : gltf.materials;
}
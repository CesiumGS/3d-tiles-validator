import { Gltf, GltfNode } from './gltfType';
import { KHRMeshInstancing } from './khrInstancingType';
const extensionName = 'EXT_mesh_gpu_instancing';

export function createEXTMeshInstancingExtension(
    gltf: Gltf,
    node: GltfNode,
    khrMeshInstancing: KHRMeshInstancing
) {
    if (gltf.extensionsUsed == null) {
        gltf.extensionsUsed = [extensionName];
    } else {
        gltf.extensionsUsed.push(extensionName);
    }

    if (node.extensions == null) {
        node.extensions = {};
    }

    node.extensions.EXT_mesh_gpu_instancing = khrMeshInstancing;
}

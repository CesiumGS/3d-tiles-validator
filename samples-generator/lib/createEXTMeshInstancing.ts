import { Gltf, GltfNode } from './gltfType';
import { AtLeastOne } from './atLeastN';

const extensionName = 'EXT_mesh_gpu_instancing';
const Extensions = require('./Extensions');

export interface ExtMeshGpuInstancing {
    attributes: AtLeastOne<{
        TRANSLATION?: number;
        ROTATION?: number;
        SCALE?: number;
    }>;
}

export function createEXTMeshInstancingExtension(
    gltf: Gltf,
    node: GltfNode,
    extMeshGpuInstancing: ExtMeshGpuInstancing
) {
    Extensions.addExtensionsUsed(gltf, extensionName);

    if (node.extensions == null) {
        node.extensions = {};
    }

    node.extensions.EXT_mesh_gpu_instancing = extMeshGpuInstancing;
}

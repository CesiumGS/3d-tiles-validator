/*
 * # Copyright (c) 2016-2017 The Khronos Group Inc.
 * # Copyright (c) 2016 Alexey Knyazev
 * #
 * # Licensed under the Apache License, Version 2.0 (the "License");
 * # you may not use this file except in compliance with the License.
 * # You may obtain a copy of the License at
 * #
 * #     http://www.apache.org/licenses/LICENSE-2.0
 * #
 * # Unless required by applicable law or agreed to in writing, software
 * # distributed under the License is distributed on an "AS IS" BASIS,
 * # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * # See the License for the specific language governing permissions and
 * # limitations under the License.
 */

library gltf.base.members;

import 'package:quiver/core.dart';

import 'package:gltf/src/base/accessor.dart';
import 'package:gltf/src/gl.dart' as gl;

const String GLTF = 'glTF';

// GltfProperty
const String EXTENSIONS = 'extensions';
const String EXTRAS = 'extras';

// GltfChildOfRootProperty
const String NAME = 'name';

// Accessor
const String BUFFER_VIEW = 'bufferView';
const String BYTE_OFFSET = 'byteOffset';
const String COMPONENT_TYPE = 'componentType';
const String COUNT = 'count';
const String TYPE = 'type';
const String NORMALIZED = 'normalized';
const String MAX = 'max';
const String MIN = 'min';
const String SPARSE = 'sparse';

const List<String> ACCESSOR_MEMBERS = const <String>[
  BUFFER_VIEW,
  BYTE_OFFSET,
  COMPONENT_TYPE,
  COUNT,
  TYPE,
  NORMALIZED,
  MAX,
  MIN,
  SPARSE,
  NAME
];

// Accessor types
const String SCALAR = 'SCALAR';
const String VEC2 = 'VEC2';
const String VEC3 = 'VEC3';
const String VEC4 = 'VEC4';
const String MAT2 = 'MAT2';
const String MAT3 = 'MAT3';
const String MAT4 = 'MAT4';

const Map<String, int> ACCESSOR_TYPES_LENGTHS = const <String, int>{
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

// AccessorSparse
const String INDICES = 'indices';
const String VALUES = 'values';

const List<String> ACCESSOR_SPARSE_MEMBERS = const <String>[
  COUNT,
  INDICES,
  VALUES
];

// AccessorSparseIndices
const List<String> ACCESSOR_SPARSE_INDICES_MEMBERS = const <String>[
  BUFFER_VIEW,
  BYTE_OFFSET,
  COMPONENT_TYPE
];

// AccessorSparseValues
const List<String> ACCESSOR_SPARSE_VALUES_MEMBERS = const <String>[
  BUFFER_VIEW,
  BYTE_OFFSET
];

// Animation
const String CHANNELS = 'channels';
const String SAMPLERS = 'samplers';

const List<String> ANIMATION_MEMBERS = const <String>[CHANNELS, SAMPLERS, NAME];

// AnimationChannel
const String TARGET = 'target';
const String SAMPLER = 'sampler';

const List<String> ANIMATION_CHANNEL_MEMBERS = const <String>[TARGET, SAMPLER];

// AnimationChannelTarget
const String NODE = 'node';
const String PATH = 'path';

const List<String> ANIMATION_CHANNEL_TARGET_MEMBERS = const <String>[
  NODE,
  PATH
];

const List<String> ANIMATION_CHANNEL_TARGET_PATHS = const <String>[
  TRANSLATION,
  ROTATION,
  SCALE,
  WEIGHTS
];

// AnimationSampler
const String INPUT = 'input';
const String INTERPOLATION = 'interpolation';
const String OUTPUT = 'output';

const String LINEAR = 'LINEAR';
const String STEP = 'STEP';
const String CATMULLROMSPLINE = 'CATMULLROMSPLINE';
const String CUBICSPLINE = 'CUBICSPLINE';

const List<String> ANIMATION_SAMPLER_MEMBERS = const <String>[
  INPUT,
  INTERPOLATION,
  OUTPUT
];

const List<String> ANIMATION_SAMPLER_INTERPOLATIONS = const <String>[
  LINEAR,
  STEP,
  CATMULLROMSPLINE,
  CUBICSPLINE
];

const AccessorFormat ANIMATION_SAMPLER_INPUT_FORMAT =
    const AccessorFormat(SCALAR, gl.FLOAT);

const Map<String, List<AccessorFormat>> ANIMATION_SAMPLER_OUTPUT_FORMATS =
    const <String, List<AccessorFormat>>{
  TRANSLATION: const <AccessorFormat>[const AccessorFormat(VEC3, gl.FLOAT)],
  ROTATION: const <AccessorFormat>[
    const AccessorFormat(VEC4, gl.FLOAT),
    const AccessorFormat(VEC4, gl.UNSIGNED_BYTE, normalized: true),
    const AccessorFormat(VEC4, gl.BYTE, normalized: true),
    const AccessorFormat(VEC4, gl.UNSIGNED_SHORT, normalized: true),
    const AccessorFormat(VEC4, gl.SHORT, normalized: true)
  ],
  SCALE: const <AccessorFormat>[const AccessorFormat(VEC3, gl.FLOAT)],
  WEIGHTS: const <AccessorFormat>[
    const AccessorFormat(SCALAR, gl.FLOAT),
    const AccessorFormat(SCALAR, gl.UNSIGNED_BYTE, normalized: true),
    const AccessorFormat(SCALAR, gl.BYTE, normalized: true),
    const AccessorFormat(SCALAR, gl.UNSIGNED_SHORT, normalized: true),
    const AccessorFormat(SCALAR, gl.SHORT, normalized: true)
  ]
};

// Asset
const String COPYRIGHT = 'copyright';
const String GENERATOR = 'generator';
const String VERSION = 'version';
const String MIN_VERSION = 'minVersion';

const List<String> ASSET_MEMBERS = const <String>[
  COPYRIGHT,
  GENERATOR,
  VERSION,
  MIN_VERSION
];

// Buffer
const String URI = 'uri';
const String BYTE_LENGTH = 'byteLength';

const List<String> BUFFER_MEMBERS = const <String>[URI, BYTE_LENGTH, NAME];

const String APPLICATION_OCTET_STREAM = 'application/octet-stream';

// BufferView
const String BUFFER = 'buffer';
const String BYTE_STRIDE = 'byteStride';

const List<String> BUFFER_VIEW_MEMBERS = const <String>[
  BUFFER,
  BYTE_OFFSET,
  BYTE_LENGTH,
  BYTE_STRIDE,
  TARGET,
  NAME
];

class BufferViewUsage {
  final String _value;
  final int target;

  const BufferViewUsage._(this._value, [this.target = -1]);

  static const BufferViewUsage IBM = const BufferViewUsage._('IBM');
  static const BufferViewUsage Image = const BufferViewUsage._('Image');
  static const BufferViewUsage IndexBuffer =
      const BufferViewUsage._('IndexBuffer', gl.ELEMENT_ARRAY_BUFFER);
  static const BufferViewUsage Other = const BufferViewUsage._('Other');
  static const BufferViewUsage VertexBuffer =
      const BufferViewUsage._('VertexBuffer', gl.ARRAY_BUFFER);

  @override
  String toString() => _value;
}

class AccessorUsage {
  final String _value;

  const AccessorUsage._(this._value);

  static const AccessorUsage AnimationInput =
      const AccessorUsage._('AnimationInput');
  static const AccessorUsage AnimationOutput =
      const AccessorUsage._('AnimationOutput');
  static const AccessorUsage IBM = const AccessorUsage._('IBM');
  static const AccessorUsage PrimitiveIndices =
      const AccessorUsage._('PrimitiveIndices');
  static const AccessorUsage VertexAttribute =
      const AccessorUsage._('VertexAttribute');

  @override
  String toString() => _value;
}

// Camera
const String ORTHOGRAPHIC = 'orthographic';
const String PERSPECTIVE = 'perspective';

const List<String> CAMERA_MEMBERS = const <String>[
  TYPE,
  ORTHOGRAPHIC,
  PERSPECTIVE,
  NAME
];

const List<String> CAMERA_TYPES = const <String>[ORTHOGRAPHIC, PERSPECTIVE];

// CameraOrthographic
const String XMAG = 'xmag';
const String YMAG = 'ymag';
const String ZFAR = 'zfar';
const String ZNEAR = 'znear';

const List<String> CAMERA_ORTHOGRAPHIC_MEMBERS = const <String>[
  XMAG,
  YMAG,
  ZFAR,
  ZNEAR
];

// CameraPerspective
const String ASPECT_RATIO = 'aspectRatio';
const String YFOV = 'yfov';

const List<String> CAMERA_PERSPECTIVE_MEMBERS = const <String>[
  ASPECT_RATIO,
  YFOV,
  ZFAR,
  ZNEAR
];

// Gltf
const String EXTENSIONS_USED = 'extensionsUsed';
const String EXTENSIONS_REQUIRED = 'extensionsRequired';
const String ACCESSORS = 'accessors';
const String ANIMATIONS = 'animations';
const String ASSET = 'asset';
const String BUFFERS = 'buffers';
const String BUFFER_VIEWS = 'bufferViews';
const String CAMERAS = 'cameras';
const String IMAGES = 'images';
const String MATERIALS = 'materials';
const String MESHES = 'meshes';
const String NODES = 'nodes';
const String SCENE = 'scene';
const String SCENES = 'scenes';
const String SKINS = 'skins';
const String TEXTURES = 'textures';

const List<String> GLTF_MEMBERS = const <String>[
  EXTENSIONS_USED,
  EXTENSIONS_REQUIRED,
  ACCESSORS,
  ANIMATIONS,
  ASSET,
  BUFFERS,
  BUFFER_VIEWS,
  CAMERAS,
  IMAGES,
  MATERIALS,
  MESHES,
  NODES,
  SAMPLERS,
  SCENE,
  SCENES,
  SKINS,
  TEXTURES
];

// Image
const String MIME_TYPE = 'mimeType';
const List<String> IMAGE_MEMBERS = const <String>[
  BUFFER_VIEW,
  MIME_TYPE,
  URI,
  NAME
];

const String IMAGE_JPEG = 'image/jpeg';
const String IMAGE_PNG = 'image/png';

const List<String> IMAGE_MIME_TYPES = const <String>[IMAGE_JPEG, IMAGE_PNG];

// Material
const String PBR_METALLIC_ROUGHNESS = 'pbrMetallicRoughness';
const String NORMAL_TEXTURE = 'normalTexture';
const String OCCLUSION_TEXTURE = 'occlusionTexture';
const String EMISSIVE_TEXTURE = 'emissiveTexture';
const String EMISSIVE_FACTOR = 'emissiveFactor';
const String ALPHA_MODE = 'alphaMode';
const String ALPHA_CUTOFF = 'alphaCutoff';
const String DOUBLE_SIDED = 'doubleSided';

// material.alphaMode
const String OPAQUE = 'OPAQUE';
const String MASK = 'MASK';
const String BLEND = 'BLEND';

const List<String> MATERIAL_ALPHA_MODES = const <String>[OPAQUE, MASK, BLEND];

const List<String> MATERIAL_MEMBERS = const <String>[
  PBR_METALLIC_ROUGHNESS,
  NORMAL_TEXTURE,
  OCCLUSION_TEXTURE,
  EMISSIVE_TEXTURE,
  EMISSIVE_FACTOR,
  ALPHA_MODE,
  ALPHA_CUTOFF,
  DOUBLE_SIDED,
  NAME
];

// PbrMetallicRoughness
const String BASE_COLOR_FACTOR = 'baseColorFactor';
const String BASE_COLOR_TEXTURE = 'baseColorTexture';
const String METALLIC_FACTOR = 'metallicFactor';
const String ROUGHNESS_FACTOR = 'roughnessFactor';
const String METALLIC_ROUGHNESS_TEXTURE = 'metallicRoughnessTexture';

const List<String> PBR_METALLIC_ROUGHNESS_MEMBERS = const <String>[
  BASE_COLOR_FACTOR,
  BASE_COLOR_TEXTURE,
  METALLIC_FACTOR,
  ROUGHNESS_FACTOR,
  METALLIC_ROUGHNESS_TEXTURE
];

// Mesh
const String PRIMITIVES = 'primitives';
const String WEIGHTS = 'weights';

const List<String> MESH_MEMBERS = const <String>[PRIMITIVES, WEIGHTS, NAME];

// MeshPrimitive
const String ATTRIBUTES = 'attributes';
const String MATERIAL = 'material';
const String MODE = 'mode';
const String TARGETS = 'targets';

const List<String> MESH_PRIMITIVE_MEMBERS = const <String>[
  ATTRIBUTES,
  INDICES,
  MATERIAL,
  MODE,
  TARGETS
];

const List<AccessorFormat> MESH_PRIMITIVE_INDICES_FORMATS =
    const <AccessorFormat>[
  const AccessorFormat(SCALAR, gl.UNSIGNED_BYTE),
  const AccessorFormat(SCALAR, gl.UNSIGNED_SHORT),
  const AccessorFormat(SCALAR, gl.UNSIGNED_INT)
];

// Node
const String CAMERA = 'camera';
const String CHILDREN = 'children';
const String SKIN = 'skin';
const String MATRIX = 'matrix';
const String MESH = 'mesh';
const String ROTATION = 'rotation';
const String SCALE = 'scale';
const String TRANSLATION = 'translation';

const List<String> NODE_MEMBERS = const <String>[
  CAMERA,
  CHILDREN,
  SKIN,
  MATRIX,
  MESH,
  ROTATION,
  SCALE,
  TRANSLATION,
  WEIGHTS,
  NAME
];

// Sampler
const String MAG_FILTER = 'magFilter';
const String MIN_FILTER = 'minFilter';
const String WRAP_S = 'wrapS';
const String WRAP_T = 'wrapT';

const List<String> SAMPLER_MEMBERS = const <String>[
  MAG_FILTER,
  MIN_FILTER,
  WRAP_S,
  WRAP_T,
  NAME
];

const List<int> MAG_FILTERS = const <int>[gl.NEAREST, gl.LINEAR];

const List<int> MIN_FILTERS = const <int>[
  gl.NEAREST,
  gl.LINEAR,
  gl.NEAREST_MIPMAP_NEAREST,
  gl.LINEAR_MIPMAP_NEAREST,
  gl.NEAREST_MIPMAP_LINEAR,
  gl.LINEAR_MIPMAP_LINEAR
];

const List<int> wrapFiltersEnum = const <int>[
  gl.CLAMP_TO_EDGE,
  gl.MIRRORED_REPEAT,
  gl.REPEAT
];

// Scene
const List<String> SCENE_MEMBERS = const <String>[NODES, NAME];

// Skin
const String INVERSE_BIND_MATRICES = 'inverseBindMatrices';
const String SKELETON = 'skeleton';
const String JOINTS = 'joints';

const List<String> SKIN_MEMBERS = const <String>[
  INVERSE_BIND_MATRICES,
  SKELETON,
  JOINTS,
  NAME
];

const AccessorFormat SKIN_IBM_FORMAT = const AccessorFormat(MAT4, gl.FLOAT);

// Attribute semantics
const String POSITION = 'POSITION';
const String NORMAL = 'NORMAL';
const String TANGENT = 'TANGENT';
const String TEXCOORD_ = 'TEXCOORD';
const String COLOR_ = 'COLOR';
const String JOINTS_ = 'JOINTS';
const String WEIGHTS_ = 'WEIGHTS';

const List<String> ATTRIBUTE_SEMANTIC_MEMBERS = const <String>[
  POSITION,
  NORMAL,
  TANGENT
];

const List<String> ATTRIBUTE_SEMANTIC_ARRAY_MEMBERS = const <String>[
  COLOR_,
  JOINTS_,
  TEXCOORD_,
  WEIGHTS_
];

const Map<String, List<AccessorFormat>> ATTRIBUTES_ACCESSORS =
    const <String, List<AccessorFormat>>{
  POSITION: const [const AccessorFormat(VEC3, gl.FLOAT)],
  NORMAL: const [const AccessorFormat(VEC3, gl.FLOAT)],
  TANGENT: const [const AccessorFormat(VEC4, gl.FLOAT)],
  TEXCOORD_: const [
    const AccessorFormat(VEC2, gl.FLOAT),
    const AccessorFormat(VEC2, gl.UNSIGNED_BYTE, normalized: true),
    const AccessorFormat(VEC2, gl.UNSIGNED_SHORT, normalized: true)
  ],
  COLOR_: const [
    const AccessorFormat(VEC3, gl.FLOAT),
    const AccessorFormat(VEC3, gl.UNSIGNED_BYTE, normalized: true),
    const AccessorFormat(VEC3, gl.UNSIGNED_SHORT, normalized: true),
    const AccessorFormat(VEC4, gl.FLOAT),
    const AccessorFormat(VEC4, gl.UNSIGNED_BYTE, normalized: true),
    const AccessorFormat(VEC4, gl.UNSIGNED_SHORT, normalized: true)
  ],
  JOINTS_: const [
    const AccessorFormat(VEC4, gl.UNSIGNED_BYTE),
    const AccessorFormat(VEC4, gl.UNSIGNED_SHORT)
  ],
  WEIGHTS_: const [
    const AccessorFormat(VEC4, gl.FLOAT),
    const AccessorFormat(VEC4, gl.UNSIGNED_BYTE, normalized: true),
    const AccessorFormat(VEC4, gl.UNSIGNED_SHORT, normalized: true)
  ]
};

const Map<String, List<AccessorFormat>> MORPH_ATTRIBUTES_ACCESSORS =
    const <String, List<AccessorFormat>>{
  POSITION: const [const AccessorFormat(VEC3, gl.FLOAT)],
  NORMAL: const [const AccessorFormat(VEC3, gl.FLOAT)],
  TANGENT: const [const AccessorFormat(VEC3, gl.FLOAT)],
};

const Map<int, String> ATTRIBUTE_TYPES = const <int, String>{
  gl.FLOAT: SCALAR,
  gl.FLOAT_VEC2: VEC2,
  gl.FLOAT_VEC3: VEC3,
  gl.FLOAT_VEC4: VEC4,
  gl.FLOAT_MAT2: MAT2,
  gl.FLOAT_MAT3: MAT3,
  gl.FLOAT_MAT4: MAT4
};

class AccessorFormat {
  final String type;
  final int componentType;
  final bool normalized;
  const AccessorFormat(this.type, this.componentType, {this.normalized: false});

  AccessorFormat.fromAccessor(Accessor accessor)
      : this(accessor.type, accessor.componentType,
            normalized: accessor.normalized);

  @override
  String toString() =>
      '{$type, ${gl.TYPE_NAMES[componentType]}${normalized ? ' $NORMALIZED' : ''}}';

  @override
  bool operator ==(Object o) =>
      o is AccessorFormat &&
      o.type == type &&
      o.componentType == componentType &&
      o.normalized == normalized;

  @override
  int get hashCode => hash3(type, componentType, normalized);
}

// Texture
const String SOURCE = 'source';

const List<String> TEXTURE_MEMBERS = const <String>[SAMPLER, SOURCE, NAME];

// TextureInfo
const String INDEX = 'index';
const String TEX_COORD = 'texCoord';

const List<String> TEXTURE_INFO_MEMBERS = const <String>[
  INDEX,
  TEX_COORD,
];

// NormalTextureInfo
const List<String> NORMAL_TEXTURE_INFO_MEMBERS = const <String>[
  INDEX,
  TEX_COORD,
  SCALE
];

// OcclusionTextureInfo
const String STRENGTH = 'strength';

const List<String> OCCLUSION_TEXTURE_INFO_MEMBERS = const <String>[
  INDEX,
  TEX_COORD,
  STRENGTH
];

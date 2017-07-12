/*
 * # Copyright (c) 2016 The Khronos Group Inc.
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

library gltf.core.members;

import 'package:gltf/src/gl.dart' as gl;

const String GLTF = "glTF";

// GltfProperty
const String EXTENSIONS = "extensions";
const String EXTRAS = "extras";

// GltfChildOfRootProperty
const String NAME = "name";

// Accessor
const String BUFFER_VIEW = "bufferView";
const String BYTE_OFFSET = "byteOffset";
const String BYTE_STRIDE = "byteStride";
const String COMPONENT_TYPE = "componentType";
const String COUNT = "count";
const String TYPE = "type";
const String NORMALIZED = "normalized";
const String MAX = "max";
const String MIN = "min";

const List<String> ACCESSORS_MEMBERS = const <String>[
  BUFFER_VIEW,
  BYTE_OFFSET,
  BYTE_STRIDE,
  COMPONENT_TYPE,
  COUNT,
  TYPE,
  NORMALIZED,
  MAX,
  MIN,
  NAME
];

// Accessor types
const String SCALAR = "SCALAR";
const String VEC2 = "VEC2";
const String VEC3 = "VEC3";
const String VEC4 = "VEC4";
const String MAT2 = "MAT2";
const String MAT3 = "MAT3";
const String MAT4 = "MAT4";

const Map<String, int> ACCESSOR_TYPES_LENGTHS = const <String, int>{
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

// Animation
const String CHANNELS = "channels";
const String SAMPLERS = "samplers";
const String PARAMETERS = "parameters";

const List<String> ANIMATION_MEMBERS = const <String>[
  CHANNELS,
  SAMPLERS,
  NAME
];

// AnimationChannel
const String TARGET = "target";
const String SAMPLER = "sampler";

const List<String> ANIMATION_CHANNEL_MEMBERS = const <String>[TARGET, SAMPLER];

// AnimationChannelTarget
const String ID = "id";
const String PATH = "path";

const List<String> ANIMATION_CHANNEL_TARGET_MEMBERS = const <String>[ID, PATH];

// AnimationSampler
const String INPUT = "input";
const String INTERPOLATION = "interpolation";
const String OUTPUT = "output";

const List<String> ANIMATION_SAMPLER_MEMBERS = const <String>[
  INPUT,
  INTERPOLATION,
  OUTPUT
];

// Asset
const String COPYRIGHT = "copyright";
const String GENERATOR = "generator";
const String PREMULTIPLIED_ALPHA = "premultipliedAlpha";
const String PROFILE = "profile";
const String VERSION = "version";

const List<String> ASSET_MEMBERS = const <String>[
  COPYRIGHT,
  GENERATOR,
  PREMULTIPLIED_ALPHA,
  PROFILE,
  VERSION
];

// AssetProfile
const String API = "api";

const List<String> ASSET_PROFILE_MEMBERS = const <String>[API, VERSION];

// Buffer
const String URI = "uri";
const String BYTE_LENGTH = "byteLength";

const List<String> BUFFER_MEMBERS = const <String>[
  URI,
  BYTE_LENGTH,
  TYPE,
  NAME
];

// BufferView
const String BUFFER = "buffer";

const List<String> BUFFER_VIEW_MEMBERS = const <String>[
  BUFFER,
  BYTE_OFFSET,
  BYTE_LENGTH,
  TARGET,
  NAME
];

// Camera
const String ORTHOGRAPHIC = "orthographic";
const String PERSPECTIVE = "perspective";

const List<String> CAMERA_MEMBERS = const <String>[
  TYPE,
  ORTHOGRAPHIC,
  PERSPECTIVE,
  NAME
];

// CameraOrthographic
const String XMAG = "xmag";
const String YMAG = "ymag";
const String ZFAR = "zfar";
const String ZNEAR = "znear";

const List<String> CAMERA_ORTHOGRAPHIC_MEMBERS = const <String>[
  XMAG,
  YMAG,
  ZFAR,
  ZNEAR
];

// CameraPerspective
const String ASPECT_RATIO = "aspectRatio";
const String YFOV = "yfov";

const List<String> CAMERA_PERSPECTIVE_MEMBERS = const <String>[
  ASPECT_RATIO,
  YFOV,
  ZFAR,
  ZNEAR
];

// Gltf
const String EXTENSIONS_USED = "extensionsUsed";
const String EXTENSIONS_REQUIRED = "extensionsRequired";
const String GL_EXTENSIONS_USED = "glExtensionsUsed";
const String ACCESSORS = "accessors";
const String ANIMATIONS = "animations";
const String ASSET = "asset";
const String BUFFERS = "buffers";
const String BUFFER_VIEWS = "bufferViews";
const String CAMERAS = "cameras";
const String IMAGES = "images";
const String MATERIALS = "materials";
const String MESHES = "meshes";
const String NODES = "nodes";
const String PROGRAMS = "programs";
const String SCENE = "scene";
const String SCENES = "scenes";
const String SHADERS = "shaders";
const String SKINS = "skins";
const String TECHNIQUES = "techniques";
const String TEXTURES = "textures";

const List<String> GLTF_MEMBERS = const <String>[
  EXTENSIONS_USED,
  EXTENSIONS_REQUIRED,
  GL_EXTENSIONS_USED,
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
  PROGRAMS,
  SAMPLERS,
  SCENE,
  SCENES,
  SHADERS,
  SKINS,
  TECHNIQUES,
  TEXTURES
];

// Image
const List<String> IMAGE_MEMBERS = const <String>[URI, NAME];

// Material
const String TECHNIQUE = "technique";
const String VALUES = "values";

const List<String> MATERIAL_MEMBERS = const <String>[TECHNIQUE, VALUES, NAME];

// Mesh
const String PRIMITIVES = "primitives";

const List<String> MESH_MEMBERS = const <String>[PRIMITIVES, NAME];

// MeshPrimitive
const String ATTRIBUTES = "attributes";
const String INDICES = "indices";
const String MATERIAL = "material";
const String MODE = "mode";

const List<String> MESH_PRIMITIVE_MEMBERS = const <String>[
  ATTRIBUTES,
  INDICES,
  MATERIAL,
  MODE
];

// Node
const String CAMERA = "camera";
const String CHILDREN = "children";
const String SKELETONS = "skeletons";
const String SKIN = "skin";
const String JOINT_NAME = "jointName";
const String MATRIX = "matrix";
const String ROTATION = "rotation";
const String SCALE = "scale";
const String TRANSLATION = "translation";

const List<String> NODE_MEMBERS = const <String>[
  CAMERA,
  CHILDREN,
  SKELETONS,
  SKIN,
  JOINT_NAME,
  MATRIX,
  MESHES,
  ROTATION,
  SCALE,
  TRANSLATION,
  NAME
];

// Program
const String FRAGMENT_SHADER = "fragmentShader";
const String VERTEX_SHADER = "vertexShader";

const List<String> PROGRAM_MEMBERS = const <String>[
  ATTRIBUTES,
  FRAGMENT_SHADER,
  VERTEX_SHADER,
  NAME
];

// Sampler
const String MAG_FILTER = "magFilter";
const String MIN_FILTER = "minFilter";
const String WRAP_S = "wrapS";
const String WRAP_T = "wrapT";

const List<String> SAMPLER_MEMBERS = const <String>[
  MAG_FILTER,
  MIN_FILTER,
  WRAP_S,
  WRAP_T,
  NAME
];

// Scene
const List<String> SCENE_MEMBERS = const <String>[NODES, NAME];

// Shader
const List<String> SHADER_MEMBERS = const <String>[URI, TYPE, NAME];

// Skin
const String BIND_SHAPE_MATRIX = "bindShapeMatrix";
const String INVERSE_BIND_MATRICES = "inverseBindMatrices";
const String JOINT_NAMES = "jointNames";

const List<String> SKIN_MEMBERS = const <String>[
  BIND_SHAPE_MATRIX,
  INVERSE_BIND_MATRICES,
  JOINT_NAMES,
  NAME
];

// Technique
const String PROGRAM = "program";
const String UNIFORMS = "uniforms";
const String STATES = "states";

const List<String> TECHNIQUE_MEMBERS = const <String>[
  PARAMETERS,
  ATTRIBUTES,
  PROGRAM,
  UNIFORMS,
  STATES,
  NAME
];

// TechniqueParameter
const String NODE = "node";
const String SEMANTIC = "semantic";
const String VALUE = "value";

// Attribute semantics
const String POSITION = "POSITION";
const String NORMAL = "NORMAL";
const String TEXCOORD = "TEXCOORD";
const String TEXCOORD_0 = "TEXCOORD_0";
const String COLOR = "COLOR";
const String JOINT = "JOINT";
const String WEIGHT = "WEIGHT";

// Uniform semantics
const String LOCAL = "LOCAL";
const String MODEL = "MODEL";
const String VIEW = "VIEW";
const String PROJECTION = "PROJECTION";
const String MODELVIEW = "MODELVIEW";
const String MODELVIEWPROJECTION = "MODELVIEWPROJECTION";
const String MODELINVERSE = "MODELINVERSE";
const String VIEWINVERSE = "VIEWINVERSE";
const String PROJECTIONINVERSE = "PROJECTIONINVERSE";
const String MODELVIEWINVERSE = "MODELVIEWINVERSE";
const String MODELVIEWPROJECTIONINVERSE = "MODELVIEWPROJECTIONINVERSE";
const String MODELINVERSETRANSPOSE = "MODELINVERSETRANSPOSE";
const String MODELVIEWINVERSETRANSPOSE = "MODELVIEWINVERSETRANSPOSE";
const String VIEWPORT = "VIEWPORT";
const String JOINTMATRIX = "JOINTMATRIX";

const List<String> TECHNIQUE_PARAMETER_MEMBERS = const <String>[
  COUNT,
  NODE,
  TYPE,
  SEMANTIC,
  VALUE
];

const List<String> ATTRIBUTE_SEMANTIC_MEMBERS = const <String>[
  POSITION,
  NORMAL,
  JOINT,
  WEIGHT
];

const List<String> ATTRIBUTE_SEMANTIC_ARRAY_MEMBERS = const <String>[
  TEXCOORD,
  COLOR,
];

const Map<int, String> ATTRIBUTE_TYPES = const <int, String>{
  gl.FLOAT: SCALAR,
  gl.FLOAT_VEC2: VEC2,
  gl.FLOAT_VEC3: VEC3,
  gl.FLOAT_VEC4: VEC4,
  gl.FLOAT_MAT2: MAT2,
  gl.FLOAT_MAT3: MAT3,
  gl.FLOAT_MAT4: MAT4
};

// Used as a container for uniform semantic restrictions
class Semantic {
  final int type;
  final bool isArray;
  const Semantic([this.type = gl.FLOAT_MAT4, this.isArray = false]);
}

const Map<String, Semantic> UNIFORM_SEMANTICS = const <String, Semantic>{
  LOCAL: const Semantic(),
  MODEL: const Semantic(),
  VIEW: const Semantic(),
  PROJECTION: const Semantic(),
  MODELVIEW: const Semantic(),
  MODELVIEWPROJECTION: const Semantic(),
  MODELINVERSE: const Semantic(),
  VIEWINVERSE: const Semantic(),
  PROJECTIONINVERSE: const Semantic(),
  MODELVIEWINVERSE: const Semantic(),
  MODELVIEWPROJECTIONINVERSE: const Semantic(),
  MODELINVERSETRANSPOSE: const Semantic(gl.FLOAT_MAT3),
  MODELVIEWINVERSETRANSPOSE: const Semantic(gl.FLOAT_MAT3),
  VIEWPORT: const Semantic(gl.FLOAT_VEC4),
  JOINTMATRIX: const Semantic(gl.FLOAT_MAT4, true)
};

// TechniqueStates
const String ENABLE = "enable";
const String FUNCTIONS = "functions";

const List<String> TECHNIQUE_STATES_MEMBERS = const <String>[ENABLE, FUNCTIONS];

// TechniqueStatesFunctions
const String BLEND_COLOR = "blendColor";
const String BLEND_EQUATION_SEPARATE = "blendEquationSeparate";
const String BLEND_FUNC_SEPARATE = "blendFuncSeparate";
const String COLOR_MASK = "colorMask";
const String CULL_FACE = "cullFace";
const String DEPTH_FUNC = "depthFunc";
const String DEPTH_MASK = "depthMask";
const String DEPTH_RANGE = "depthRange";
const String FRONT_FACE = "frontFace";
const String LINE_WIDTH = "lineWidth";
const String POLYGON_OFFSET = "polygonOffset";
const String SCISSOR = "scissor";

const List<String> TECHNIQUE_STATES_FUNCTIONS_MEMBERS = const <String>[
  BLEND_COLOR,
  BLEND_EQUATION_SEPARATE,
  BLEND_FUNC_SEPARATE,
  COLOR_MASK,
  CULL_FACE,
  DEPTH_FUNC,
  DEPTH_MASK,
  DEPTH_RANGE,
  FRONT_FACE,
  LINE_WIDTH,
  POLYGON_OFFSET,
  SCISSOR
];

// Texture
const String FORMAT = "format";
const String INTERNAL_FORMAT = "internalFormat";
const String SOURCE = "source";

const List<String> TEXTURE_MEMBERS = const <String>[
  FORMAT,
  INTERNAL_FORMAT,
  SAMPLER,
  SOURCE,
  TARGET,
  TYPE,
  NAME
];

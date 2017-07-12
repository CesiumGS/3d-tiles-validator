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

library gltf.gl;

const int POINTS = 0;
const int LINES = 1;
const int LINE_LOOP = 2;
const int LINE_STRIP = 3;
const int TRIANGLES = 4;
const int TRIANGLE_STRIP = 5;
const int TRIANGLE_FAN = 6;

const List<int> MODES = const <int>[
  POINTS,
  LINES,
  LINE_LOOP,
  LINE_STRIP,
  TRIANGLES,
  TRIANGLE_STRIP,
  TRIANGLE_FAN
];

const int NEVER = 512;
const int LESS = 513;
const int EQUAL = 514;
const int LEQUAL = 515;
const int GREATER = 516;
const int NOTEQUAL = 517;
const int GEQUAL = 518;
const int ALWAYS = 519;

const int FRONT = 1028;
const int BACK = 1029;
const int FRONT_AND_BACK = 1032;

const int CW = 2304;
const int CCW = 2305;

const int CULL_FACE = 2884;
const int DEPTH_TEST = 2929;
const int BLEND = 3042;
const int SCISSOR_TEST = 3089;
const int POLYGON_OFFSET_FILL = 32823;
const int SAMPLE_ALPHA_TO_COVERAGE = 32926;

const int TEXTURE_2D = 3553;

const int BYTE = 5120;
const int UNSIGNED_BYTE = 5121;
const int SHORT = 5122;
const int UNSIGNED_SHORT = 5123;
const int INT = 5124;
const int UNSIGNED_INT = 5125;
const int FLOAT = 5126;

const Map<int, int> COMPONENT_TYPE_LENGTHS = const <int, int>{
  BYTE: 1,
  UNSIGNED_BYTE: 1,
  SHORT: 2,
  UNSIGNED_SHORT: 2,
  UNSIGNED_INT: 4,
  FLOAT: 4
};

const List<int> ELEMENT_ARRAY_TYPES = const <int>[
  UNSIGNED_BYTE,
  UNSIGNED_SHORT,
  UNSIGNED_INT,
];

const int ALPHA = 6406;
const int RGB = 6407;
const int RGBA = 6408;
const int LUMINANCE = 6409;
const int LUMINANCE_ALPHA = 6410;

const int NEAREST = 9728;
const int LINEAR = 9729;
const int NEAREST_MIPMAP_NEAREST = 9984;
const int LINEAR_MIPMAP_NEAREST = 9985;
const int NEAREST_MIPMAP_LINEAR = 9986;
const int LINEAR_MIPMAP_LINEAR = 9987;

const int CLAMP_TO_EDGE = 33071;
const int MIRRORED_REPEAT = 33648;
const int REPEAT = 10497;

const int FUNC_ADD = 32774;
const int FUNC_SUBTRACT = 32778;
const int FUNC_REVERSE_SUBTRACT = 32779;

const int ZERO = 0;
const int ONE = 1;
const int SRC_COLOR = 768;
const int ONE_MINUS_SRC_COLOR = 769;
const int SRC_ALPHA = 770;
const int ONE_MINUS_SRC_ALPHA = 771;
const int DST_ALPHA = 772;
const int ONE_MINUS_DST_ALPHA = 773;
const int DST_COLOR = 774;
const int ONE_MINUS_DST_COLOR = 775;
const int SRC_ALPHA_SATURATE = 776;
const int CONSTANT_COLOR = 32769;
const int ONE_MINUS_CONSTANT_COLOR = 32770;
const int CONSTANT_ALPHA = 32771;
const int ONE_MINUS_CONSTANT_ALPHA = 32772;

const int UNSIGNED_SHORT_4_4_4_4 = 32819;
const int UNSIGNED_SHORT_5_5_5_1 = 32820;
const int UNSIGNED_SHORT_5_6_5 = 33635;

const List<int> TARGETS = const <int>[ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER];

const int ARRAY_BUFFER = 34962;
const int ELEMENT_ARRAY_BUFFER = 34963;

const int FRAGMENT_SHADER = 35632;
const int VERTEX_SHADER = 35633;

const int FLOAT_VEC2 = 35664;
const int FLOAT_VEC3 = 35665;
const int FLOAT_VEC4 = 35666;
const int INT_VEC2 = 35667;
const int INT_VEC3 = 35668;
const int INT_VEC4 = 35669;
const int BOOL = 35670;
const int BOOL_VEC2 = 35671;
const int BOOL_VEC3 = 35672;
const int BOOL_VEC4 = 35673;
const int FLOAT_MAT2 = 35674;
const int FLOAT_MAT3 = 35675;
const int FLOAT_MAT4 = 35676;
const int SAMPLER_2D = 35678;

const TYPE_LENGTHS = const <int, int>{
  BYTE: 1,
  UNSIGNED_BYTE: 1,
  SHORT: 1,
  UNSIGNED_SHORT: 1,
  INT: 1,
  UNSIGNED_INT: 1,
  FLOAT: 1,
  FLOAT_VEC2: 2,
  FLOAT_VEC3: 3,
  FLOAT_VEC4: 4,
  INT_VEC2: 2,
  INT_VEC3: 3,
  INT_VEC4: 4,
  BOOL: 1,
  BOOL_VEC2: 2,
  BOOL_VEC3: 3,
  BOOL_VEC4: 4,
  FLOAT_MAT2: 4,
  FLOAT_MAT3: 9,
  FLOAT_MAT4: 16,
  SAMPLER_2D: 1
};

const TYPE_NAMES = const <int, String>{
  BYTE: "BYTE",
  UNSIGNED_BYTE: "UNSIGNED_BYTE",
  SHORT: "SHORT",
  UNSIGNED_SHORT: "UNSIGNED_SHORT",
  INT: "INT",
  UNSIGNED_INT: "UNSIGNED_INT",
  FLOAT: "FLOAT",
  FLOAT_VEC2: "FLOAT_VEC2",
  FLOAT_VEC3: "FLOAT_VEC3",
  FLOAT_VEC4: "FLOAT_VEC4",
  INT_VEC2: "INT_VEC2",
  INT_VEC3: "INT_VEC3",
  INT_VEC4: "INT_VEC4",
  BOOL: "BOOL",
  BOOL_VEC2: "BOOL_VEC2",
  BOOL_VEC3: "BOOL_VEC3",
  BOOL_VEC4: "BOOL_VEC4",
  FLOAT_MAT2: "FLOAT_MAT2",
  FLOAT_MAT3: "FLOAT_MAT3",
  FLOAT_MAT4: "FLOAT_MAT4",
  SAMPLER_2D: "SAMPLER_2D"
};

const TYPE_MINS = const <int, int>{
  BYTE: -128,
  UNSIGNED_BYTE: 0,
  SHORT: -32768,
  UNSIGNED_SHORT: 0,
  INT: -2147483648,
  UNSIGNED_INT: 0,
  INT_VEC2: -2147483648,
  INT_VEC3: -2147483648,
  INT_VEC4: -2147483648
};

const TYPE_MAXS = const <int, int>{
  BYTE: 127,
  UNSIGNED_BYTE: 255,
  SHORT: 32767,
  UNSIGNED_SHORT: 65535,
  INT: 2147483647,
  UNSIGNED_INT: 4294967295,
  INT_VEC2: 2147483647,
  INT_VEC3: 2147483647,
  INT_VEC4: 2147483647
};

const BOOL_TYPES = const <int>[BOOL, BOOL_VEC2, BOOL_VEC3, BOOL_VEC4];

const FLOAT_TYPES = const <int>[
  FLOAT,
  FLOAT_VEC2,
  FLOAT_VEC3,
  FLOAT_VEC4,
  FLOAT_MAT2,
  FLOAT_MAT3,
  FLOAT_MAT4
];

const INT_TYPES = const <int>[
  BYTE,
  UNSIGNED_BYTE,
  SHORT,
  UNSIGNED_SHORT,
  INT,
  UNSIGNED_INT,
  INT_VEC2,
  INT_VEC3,
  INT_VEC4
];

const String OES_ELEMENT_INDEX_UINT = "OES_element_index_uint";

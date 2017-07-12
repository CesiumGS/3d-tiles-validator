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

library gltf.extensions.khr_binary_gltf.glb.errors;

import 'package:gltf/src/errors.dart';

enum Severity { Error, Warning }

abstract class GlbWarning {
  static const GLB_SUB_OPTIMAL_SCENELENGTH = "GLB_SUB_OPTIMAL_SCENELENGTH";

  static final messages = <String, ErrorFunction>{
    GLB_SUB_OPTIMAL_SCENELENGTH: (List args) =>
        "Sub-optimal (${args[0]} % 4 != 0) scene length."
  };
}

abstract class GlbError {
  static const GLB_INVALID_MAGIC = "GLB_INVALID_MAGIC";
  static const GLB_INVALID_VERSION = "GLB_INVALID_VERSION";
  static const GLB_INVALID_SCENEFORMAT = "GLB_INVALID_SCENEFORMAT";
  static const GLB_FILE_TOO_SHORT = "GLB_FILE_TOO_SHORT";
  static const GLB_UNEXPECTED_END_OF_HEADER = "GLB_UNEXPECTED_END_OF_HEADER";
  static const GLB_UNEXPECTED_END_OF_SCENE = "GLB_UNEXPECTED_END_OF_SCENE";
  static const GLB_UNEXPECTED_END_OF_FILE = "GLB_UNEXPECTED_END_OF_FILE";

  static final messages = <String, ErrorFunction>{
    GLB_INVALID_MAGIC: (List args) => "Invalid glTF magic value (${args[0]}).",
    GLB_INVALID_VERSION: (List args) =>
        "Invalid glTF version value (${args[0]}).",
    GLB_INVALID_SCENEFORMAT: (List args) =>
        "Invalid glTF sceneFormat value (${args[0]}).",
    GLB_FILE_TOO_SHORT: (List args) =>
        "File length less than headerLength + sceneLength",
    GLB_UNEXPECTED_END_OF_HEADER: (List args) => "Unexpected end of header.",
    GLB_UNEXPECTED_END_OF_SCENE: (List args) => "Unexpected end of `scene`.",
    GLB_UNEXPECTED_END_OF_FILE: (List args) => "Unexpected end of file."
  };
}

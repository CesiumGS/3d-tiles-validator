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

library gltf.core.gltf_property;

import 'gltf.dart';
import 'members.dart';
import 'package:gltf/src/context.dart';
import 'package:gltf/src/utils.dart';

export 'gltf.dart';
export 'members.dart';
export 'package:gltf/src/context.dart';
export 'package:gltf/src/errors.dart';
export 'package:gltf/src/utils.dart';

typedef Object FromMapFunction(Map<String, Object> map, Context context);

typedef void LinkFunction(Gltf gltf);

abstract class Linkable {
  void link(Gltf gltf, Context context);
}

abstract class Stringable {
  String toString([Map/*=Map<String, Object>*/ map]) =>
      mapToString(map ?? <String, Object>{});
}

abstract class GltfProperty extends Stringable {
  final Map<String, Object> extensions;
  final Object extras;
  GltfProperty(this.extensions, this.extras);

  String toString([Map/*=Map<String, Object>*/ map]) {
    map ??= <String, Object>{};
    map[EXTENSIONS] = extensions;
    map[EXTRAS] = extras;

    return super.toString(map);
  }
}

abstract class GltfChildOfRootProperty extends GltfProperty {
  final String name;
  GltfChildOfRootProperty(
      this.name, Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([Map/*=Map<String, Object>*/ map]) {
    map ??= <String, Object>{};
    map[NAME] = name;
    return super.toString(map);
  }
}

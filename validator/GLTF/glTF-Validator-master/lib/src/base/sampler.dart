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

library gltf.core.sampler;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Sampler extends GltfChildOfRootProperty {
  final int magFilter;
  final int minFilter;
  final int wrapS;
  final int wrapT;

  Sampler._(this.magFilter, this.minFilter, this.wrapS, this.wrapT, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        MAG_FILTER: magFilter,
        MIN_FILTER: minFilter,
        WRAP_S: wrapS,
        WRAP_T: wrapT
      });

  static Sampler fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, SAMPLER_MEMBERS, context);

    const List<int> magFiltersEnum = const <int>[gl.NEAREST, gl.LINEAR];

    const List<int> minFiltersEnum = const <int>[
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

    return new Sampler._(
        getInt(map, MAG_FILTER, context, list: magFiltersEnum, def: gl.NEAREST),
        getInt(map, MIN_FILTER, context,
            list: minFiltersEnum, def: gl.NEAREST_MIPMAP_LINEAR),
        getInt(map, WRAP_S, context, list: wrapFiltersEnum, def: gl.REPEAT),
        getInt(map, WRAP_T, context, list: wrapFiltersEnum, def: gl.REPEAT),
        getName(map, context),
        getExtensions(map, Sampler, context),
        getExtras(map));
  }
}

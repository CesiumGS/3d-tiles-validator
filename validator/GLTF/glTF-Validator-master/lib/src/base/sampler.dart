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

library gltf.base.sampler;

import 'package:gltf/src/base/gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Sampler extends GltfChildOfRootProperty {
  final int magFilter;
  final int minFilter;
  final int wrapS;
  final int wrapT;

  Sampler._(this.magFilter, this.minFilter, this.wrapS, this.wrapT, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  @override
  String toString([_]) => super.toString({
        MAG_FILTER: magFilter,
        MIN_FILTER: minFilter,
        WRAP_S: wrapS,
        WRAP_T: wrapT
      });

  static Sampler fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, SAMPLER_MEMBERS, context);
    }

    return new Sampler._(
        getUint(map, MAG_FILTER, context, list: MAG_FILTERS),
        getUint(map, MIN_FILTER, context, list: MIN_FILTERS),
        getUint(map, WRAP_S, context, list: wrapFiltersEnum, def: gl.REPEAT),
        getUint(map, WRAP_T, context, list: wrapFiltersEnum, def: gl.REPEAT),
        getName(map, context),
        getExtensions(map, Sampler, context),
        getExtras(map));
  }
}

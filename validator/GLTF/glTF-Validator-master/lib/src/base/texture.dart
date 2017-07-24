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

library gltf.base.texture;

import 'gltf_property.dart';

class Texture extends GltfChildOfRootProperty {
  final int _samplerIndex;
  final int _sourceIndex;

  Sampler _sampler;
  Image _source;

  Texture._(this._samplerIndex, this._sourceIndex, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  Sampler get sampler => _sampler;
  Image get source => _source;

  @override
  String toString([_]) => super.toString({
        SAMPLER: _samplerIndex,
        SOURCE: _sourceIndex,
      });

  static Texture fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, TEXTURE_MEMBERS, context);
    }

    return new Texture._(
        getIndex(map, SAMPLER, context, req: false),
        getIndex(map, SOURCE, context, req: false),
        getName(map, context),
        getExtensions(map, Texture, context),
        getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    _source = gltf.images[_sourceIndex];
    _sampler = gltf.samplers[_samplerIndex];

    if (context.validate) {
      if (_sourceIndex != -1 && _source == null)
        context.addIssue(LinkError.unresolvedReference,
            name: SOURCE, args: [_sourceIndex]);

      if (_samplerIndex != -1 && _sampler == null)
        context.addIssue(LinkError.unresolvedReference,
            name: SAMPLER, args: [_samplerIndex]);
    }
  }
}

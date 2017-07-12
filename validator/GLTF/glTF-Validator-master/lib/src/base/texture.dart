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

library gltf.core.texture;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Texture extends GltfChildOfRootProperty implements Linkable {
  final int format;
  final int internalFormat;
  final String _samplerId;
  final String _sourceId;
  final int target;
  final int type;

  Sampler sampler;
  Image source;

  Texture._(
      this.format,
      this.internalFormat,
      this._samplerId,
      this._sourceId,
      this.target,
      this.type,
      String name,
      Map<String, Object> extensions,
      Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        FORMAT: format,
        INTERNAL_FORMAT: internalFormat,
        SAMPLER: _samplerId,
        SOURCE: _sourceId,
        TARGET: target,
        TYPE: type
      });

  static Texture fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, TEXTURE_MEMBERS, context);

    const List<int> formatsEnum = const <int>[
      gl.ALPHA,
      gl.RGB,
      gl.RGBA,
      gl.LUMINANCE,
      gl.LUMINANCE_ALPHA
    ];

    const List<int> targetsEnum = const <int>[gl.TEXTURE_2D];

    const List<int> typesEnum = const <int>[
      gl.UNSIGNED_BYTE,
      gl.UNSIGNED_SHORT_5_6_5,
      gl.UNSIGNED_SHORT_4_4_4_4,
      gl.UNSIGNED_SHORT_5_5_5_1
    ];

    final format =
        getInt(map, FORMAT, context, list: formatsEnum, def: gl.RGBA);
    final internalformat =
        getInt(map, INTERNAL_FORMAT, context, list: formatsEnum, def: gl.RGBA);
    final type =
        getInt(map, TYPE, context, list: typesEnum, def: gl.UNSIGNED_BYTE);

    if (context.validate) {
      if (format != internalformat) {
        context.addIssue(GltfError.TEXTURE_FORMAT_INTERNALFORMAT);
      }

      if ((type == gl.UNSIGNED_SHORT_4_4_4_4 && format != gl.RGBA) ||
          (type == gl.UNSIGNED_SHORT_5_5_5_1 && format != gl.RGBA) ||
          (type == gl.UNSIGNED_SHORT_5_6_5 && format != gl.RGB)) {
        context.addIssue(GltfError.TEXTURE_FORMAT_TYPE);
      }
    }

    return new Texture._(
        format,
        internalformat,
        getId(map, SAMPLER, context),
        getId(map, SOURCE, context),
        getInt(map, TARGET, context, list: targetsEnum, def: gl.TEXTURE_2D),
        type,
        getName(map, context),
        getExtensions(map, Texture, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    source = gltf.images[_sourceId];
    if (context.validate && source == null)
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: SOURCE, args: [_sourceId]);

    sampler = gltf.samplers[_samplerId];
    if (context.validate && sampler == null)
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: SAMPLER, args: [_samplerId]);
  }
}

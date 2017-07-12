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

library gltf.core.shader;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Shader extends GltfChildOfRootProperty {
  final Uri uri;
  final String source;
  final int type;

  Shader._(this.uri, this.source, this.type, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({URI: uri, TYPE: type});

  static Shader fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, SHADER_MEMBERS, context);

    const List<int> typesEnum = const <int>[
      gl.FRAGMENT_SHADER,
      gl.VERTEX_SHADER
    ];

    Uri uri;
    String source;

    final uriString = getString(map, URI, context, req: true);

    if (uriString != null) {
      if (uriString.startsWith("data:")) {
        try {
          final uriData = UriData.parse(uriString);
          if (uriData.mimeType == "text/plain") {
            source = uriData.contentAsString();
          } else {
            context.addIssue(GltfError.INVALID_DATA_URI_MIME,
                name: URI, args: [uriData.mimeType]);
          }
        } on FormatException catch (e) {
          context.addIssue(GltfError.INVALID_DATA_URI, name: URI, args: [e]);
        } on UnsupportedError catch (e) {
          context.addIssue(GltfError.INVALID_DATA_URI, name: URI, args: [e]);
        }
      } else {
        uri = parseUri(uriString, context);
      }
    }

    return new Shader._(
        uri,
        source,
        getInt(map, TYPE, context, req: true, list: typesEnum),
        getName(map, context),
        getExtensions(map, Shader, context),
        getExtras(map));
  }
}

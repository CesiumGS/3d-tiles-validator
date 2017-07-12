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

library gltf.core.program;

import 'gltf_property.dart';

class Program extends GltfChildOfRootProperty implements Linkable {
  final List<String> attributes;
  final String _fragmentShaderId;
  final String _vertexShaderId;

  Shader fragmentShader;
  Shader vertexShader;

  Program._(this.attributes, this._fragmentShaderId, this._vertexShaderId,
      String name, Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        ATTRIBUTES: attributes,
        FRAGMENT_SHADER: _fragmentShaderId,
        VERTEX_SHADER: _vertexShaderId
      });

  static Program fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, PROGRAM_MEMBERS, context);

    return new Program._(
        getStringList(map, ATTRIBUTES, context,
            minItems: 1, maxItems: 256, def: <String>[]),
        getId(map, FRAGMENT_SHADER, context),
        getId(map, VERTEX_SHADER, context),
        getName(map, context),
        getExtensions(map, Program, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    fragmentShader = gltf.shaders[_fragmentShaderId];
    if (context.validate && fragmentShader == null)
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: FRAGMENT_SHADER, args: [_fragmentShaderId]);

    vertexShader = gltf.shaders[_vertexShaderId];
    if (context.validate && vertexShader == null)
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: VERTEX_SHADER, args: [_vertexShaderId]);
  }
}

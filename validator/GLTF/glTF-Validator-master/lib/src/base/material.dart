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

library gltf.core.material;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Material extends GltfChildOfRootProperty implements Linkable {
  final String techniqueId;
  final Map<String, Object> _values;
  final Map<String, List> values = <String, List>{};

  Technique technique;

  Material._(this.techniqueId, this._values, String name,
      Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) =>
      super.toString({TECHNIQUE: techniqueId, VALUES: values});

  static Material fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, MATERIAL_MEMBERS, context);

    final techniqueId = getId(map, TECHNIQUE, context, req: false);

    if (techniqueId == null && map.containsKey(VALUES)) {
      context.addIssue(GltfWarning.MATERIALS_VALUES_WITHOUT_TECHNIQUE);
    }

    return new Material._(
        techniqueId,
        getMap(map, VALUES, context),
        getName(map, context),
        getExtensions(map, Material, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    technique = gltf.techniques[techniqueId];

    if (technique != null) {
      if (_values.isNotEmpty) {
        context.path.add(VALUES);
        for (final parameterId in _values.keys) {
          if (context.validate &&
              technique.attributes.containsValue(parameterId)) {
            context.addIssue(GltfError.MATERIAL_NO_ATTRIBUTES,
                name: parameterId);
            return;
          }

          final parameter = technique.parameters[parameterId];
          if (parameter == null) {
            context
                .addIssue(GltfError.UNRESOLVED_REFERENCE, args: [parameterId]);
            return;
          }

          List value;
          if (parameter.type != null) {
            if (parameter.type == gl.SAMPLER_2D) {
              value = new List<Texture>(parameter.count ?? 1);

              final stringValues = getStringList(_values, parameterId, context,
                  lengthsList: [parameter.count ?? 1]);

              if (stringValues != null) {
                for (int i = 0; i < stringValues.length; i++) {
                  final texture = gltf.textures[stringValues[i]];
                  if (texture == null) {
                    context.addIssue(GltfError.UNRESOLVED_REFERENCE,
                        name: parameterId, args: [stringValues[i]]);
                  } else {
                    value[i] = texture;
                  }
                }
              }
            } else if (gl.BOOL_TYPES.contains(parameter.type)) {
              value = getBoolList(_values, parameterId, context, lengthsList: [
                (parameter.count ?? 1) * gl.TYPE_LENGTHS[parameter.type]
              ]);
            } else if (gl.FLOAT_TYPES.contains(parameter.type)) {
              value = getNumList(_values, parameterId, context, lengthsList: [
                (parameter.count ?? 1) * gl.TYPE_LENGTHS[parameter.type]
              ]);
            } else if (gl.INT_TYPES.contains(parameter.type)) {
              value = getGlIntList(_values, parameterId, context,
                  length:
                      (parameter.count ?? 1) * gl.TYPE_LENGTHS[parameter.type],
                  type: parameter.type);
            }
            values[parameterId] = value;
          }
        }
        context.path.removeLast();
      }
    } else if (techniqueId != null) {
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: TECHNIQUE, args: [techniqueId]);
    }
  }
}

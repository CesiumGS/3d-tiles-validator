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

library gltf.core.skin;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Skin extends GltfChildOfRootProperty implements Linkable {
  final List<num> bindShapeMatrix;
  final String _inverseBindMatricesId;
  final List<String> jointNames;

  Accessor inverseBindMatrices;

  Skin._(this.bindShapeMatrix, this._inverseBindMatricesId, this.jointNames,
      String name, Map<String, Object> extensions, Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        BIND_SHAPE_MATRIX: bindShapeMatrix,
        INVERSE_BIND_MATRICES: _inverseBindMatricesId,
        JOINT_NAMES: jointNames
      });

  static Skin fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, SKIN_MEMBERS, context);

    final jointNames = getStringList(map, JOINT_NAMES, context);

    final defMat = <num>[
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0
    ];

    return new Skin._(
        getNumList(map, BIND_SHAPE_MATRIX, context,
            lengthsList: [16], def: defMat),
        getId(map, INVERSE_BIND_MATRICES, context, req: false),
        jointNames,
        getName(map, context),
        getExtensions(map, Skin, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    inverseBindMatrices = gltf.accessors[_inverseBindMatricesId];

    if (context.validate) {
      if (_inverseBindMatricesId != null) {
        if (inverseBindMatrices == null) {
          context.addIssue(GltfError.UNRESOLVED_REFERENCE,
              name: INVERSE_BIND_MATRICES, args: [_inverseBindMatricesId]);
        } else {
          if (inverseBindMatrices.type != MAT4) {
            context.addIssue(GltfError.INVALID_ACCESSOR_TYPE,
                name: INVERSE_BIND_MATRICES,
                args: [MAT4, inverseBindMatrices.type]);
          }

          if (inverseBindMatrices.componentType != gl.FLOAT) {
            context.addIssue(GltfError.INVALID_ACCESSOR_COMPONENT_TYPE,
                name: INVERSE_BIND_MATRICES,
                args: [gl.FLOAT, inverseBindMatrices.componentType]);
          }

          if (inverseBindMatrices.bufferView?.target != null) {
            context.addIssue(GltfWarning.SKIN_ACCESSOR_WRONG_BUFFER_VIEW_TARGET,
                name: INVERSE_BIND_MATRICES, args: [_inverseBindMatricesId]);
          }

          if (inverseBindMatrices.count != jointNames.length) {
            context.addIssue(GltfError.SKIN_INVALID_ACCESSOR_COUNT,
                name: INVERSE_BIND_MATRICES,
                args: [jointNames.length, inverseBindMatrices.count]);
          }
        }
      }
    }

    /*for (final jointName in jointNames) {
      final joint = gltf.joints[jointName];
      if (joint == null)
        context.addIssue(GltfError.UNRESOLVED_REFERENCE,
            name: JOINT_NAMES, args: [jointName]);
    }*/
  }
}

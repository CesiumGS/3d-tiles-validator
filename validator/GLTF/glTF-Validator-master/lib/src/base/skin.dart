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

library gltf.base.skin;

import 'package:gltf/src/base/gltf_property.dart';

class Skin extends GltfChildOfRootProperty {
  final int _inverseBindMatricesIndex;
  final int _skeletonIndex;
  final List<int> _jointsIndices;

  Accessor _inverseBindMatrices;
  List<Node> _joints;
  Node _skeleton;

  Skin._(
      this._inverseBindMatricesIndex,
      this._skeletonIndex,
      this._jointsIndices,
      String name,
      Map<String, Object> extensions,
      Object extras)
      : super(name, extensions, extras);

  Accessor get inverseBindMatrices => _inverseBindMatrices;
  List<Node> get joints => _joints;
  Node get skeleton => _skeleton;

  @override
  String toString([_]) => super.toString({
        INVERSE_BIND_MATRICES: _inverseBindMatricesIndex,
        SKELETON: _skeletonIndex,
        JOINTS: _jointsIndices
      });

  static Skin fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, SKIN_MEMBERS, context);
    }

    return new Skin._(
        getIndex(map, INVERSE_BIND_MATRICES, context, req: false),
        getIndex(map, SKELETON, context, req: false),
        getIndicesList(map, JOINTS, context, req: true),
        getName(map, context),
        getExtensions(map, Skin, context),
        getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    _inverseBindMatrices = gltf.accessors[_inverseBindMatricesIndex];

    _skeleton = gltf.nodes[_skeletonIndex];

    if (_jointsIndices != null) {
      _joints = new List<Node>(_jointsIndices.length);

      resolveNodeList(_jointsIndices, _joints, gltf.nodes, JOINTS, context,
          (node, nodeIndex, index) {
        node.isJoint = true;
        // TODO: possible restrictions on joint nodes
      });
    }

    if (_inverseBindMatricesIndex != -1) {
      if (_inverseBindMatrices == null) {
        context.addIssue(LinkError.unresolvedReference,
            name: INVERSE_BIND_MATRICES, args: [_inverseBindMatricesIndex]);
      } else {
        _inverseBindMatrices.setUsage(
            AccessorUsage.IBM, INVERSE_BIND_MATRICES, context);
        _inverseBindMatrices.bufferView
            ?.setUsage(BufferViewUsage.IBM, INVERSE_BIND_MATRICES, context);

        if (context.validate) {
          final format = new AccessorFormat.fromAccessor(_inverseBindMatrices);
          if (format != SKIN_IBM_FORMAT) {
            context.addIssue(LinkError.skinIbmInvalidFormat,
                name: INVERSE_BIND_MATRICES,
                args: [
                  [SKIN_IBM_FORMAT],
                  format
                ]);
          }

          if (_joints != null && _inverseBindMatrices.count != _joints.length) {
            context.addIssue(LinkError.invalidIbmAccessorCount,
                name: INVERSE_BIND_MATRICES,
                args: [_joints.length, _inverseBindMatrices.count]);
          }
        }
      }
    }

    if (_skeletonIndex != -1 && _skeleton == null) {
      context.addIssue(LinkError.unresolvedReference,
          name: SKELETON, args: [_skeletonIndex]);
    }
  }
}

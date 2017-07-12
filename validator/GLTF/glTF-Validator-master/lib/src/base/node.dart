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

library gltf.core.node;

import 'gltf_property.dart';

class Node extends GltfChildOfRootProperty implements Linkable {
  final String _cameraId;
  final List<String> _childrenIds;
  final List<String> _skeletonsIds;
  final String _skinId;
  final String jointName;
  final List<num> matrix;
  final List<String> _meshesIds;
  final List<num> rotation;
  final List<num> scale;
  final List<num> translation;

  Camera camera;
  Skin skin;
  final List<Node> children = <Node>[];
  final List<Node> skeletons = <Node>[];
  final List<Mesh> meshes = <Mesh>[];

  Node parent;

  Node._(
      this._cameraId,
      this._childrenIds,
      this._skeletonsIds,
      this._skinId,
      this.jointName,
      this.matrix,
      this._meshesIds,
      this.rotation,
      this.scale,
      this.translation,
      String name,
      Map<String, Object> extensions,
      Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        CAMERA: _cameraId,
        CHILDREN: _childrenIds,
        SKELETONS: _skeletonsIds,
        SKIN: _skinId,
        JOINT_NAME: jointName,
        MATRIX: matrix,
        MESHES: _meshesIds,
        ROTATION: rotation,
        SCALE: scale,
        TRANSLATION: translation
      });

  static Node fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, NODE_MEMBERS, context);

    final childrenIds = getStringList(map, CHILDREN, context, def: <String>[]);
    if (context.validate && childrenIds != null) {
      removeDuplicates(childrenIds, context, CHILDREN);
    }

    final skeletonsIds = getStringList(map, SKELETONS, context);
    if (context.validate && skeletonsIds != null) {
      removeDuplicates(skeletonsIds, context, SKELETONS);
    }

    final meshesIds = getStringList(map, MESHES, context);
    if (context.validate && meshesIds != null) {
      removeDuplicates(meshesIds, context, MESHES);
    }

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
    final defRot = <num>[0.0, 0.0, 0.0, 1.0];
    final defScale = <num>[1.0, 1.0, 1.0];
    final defTrans = <num>[0.0, 0.0, 0.0];

    return new Node._(
        getId(map, CAMERA, context, req: false),
        childrenIds,
        skeletonsIds,
        getId(map, SKIN, context, req: false),
        getId(map, JOINT_NAME, context, req: false),
        getNumList(map, MATRIX, context,
            minItems: 16, maxItems: 16, def: defMat),
        meshesIds,
        getNumList(map, ROTATION, context,
            minItems: 4, maxItems: 4, def: defRot),
        getNumList(map, SCALE, context,
            minItems: 3, maxItems: 3, def: defScale),
        getNumList(map, TRANSLATION, context,
            minItems: 3, maxItems: 3, def: defTrans),
        getName(map, context),
        getExtensions(map, Node, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    // TODO: skinning-related checks

    camera = gltf.cameras[_cameraId];
    skin = gltf.skins[_skinId];

    if (context.validate) {
      if (_cameraId != null && camera == null) {
        context.addIssue(GltfError.UNRESOLVED_REFERENCE,
            name: CAMERA, args: [_cameraId]);
      }
      if (_skinId != null && skin == null) {
        context.addIssue(GltfError.UNRESOLVED_REFERENCE,
            name: SKIN, args: [_skinId]);
      }
    }

    resolveList/*<Node>*/(_childrenIds, children, gltf.nodes, CHILDREN, context,
        (node, id) {
      if (node.parent != null) {
        context.addIssue(GltfError.NODE_PARENT_OVERRIDE,
            name: CHILDREN, args: [id]);
      }
      node.parent = this;
    });
    resolveList/*<Node>*/(
        _skeletonsIds, skeletons, gltf.nodes, SKELETONS, context);
    resolveList/*<Mesh>*/(_meshesIds, meshes, gltf.meshes, MESHES, context);
  }
}

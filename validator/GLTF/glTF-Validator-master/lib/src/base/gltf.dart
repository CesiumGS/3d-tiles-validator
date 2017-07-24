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

library gltf.base.gltf;

import 'accessor.dart';
import 'animation.dart';
import 'asset.dart';
import 'buffer.dart';
import 'buffer_view.dart';
import 'camera.dart';
import 'gltf_property.dart';
import 'image.dart';
import 'material.dart';
import 'mesh.dart';
import 'node.dart';
import 'sampler.dart';
import 'scene.dart';
import 'skin.dart';
import 'texture.dart';

export 'accessor.dart';
export 'animation.dart';
export 'asset.dart';
export 'buffer.dart';
export 'buffer_view.dart';
export 'camera.dart';
export 'image.dart';
export 'material.dart';
export 'mesh.dart';
export 'node.dart';
export 'sampler.dart';
export 'scene.dart';
export 'skin.dart';
export 'texture.dart';

class Gltf extends GltfProperty {
  final List<String> extensionsUsed;
  final List<String> extensionsRequired;
  final SafeList<Accessor> accessors;
  final SafeList<Animation> animations;
  final Asset asset;
  final SafeList<Buffer> buffers;
  final SafeList<BufferView> bufferViews;
  final SafeList<Camera> cameras;
  final SafeList<Image> images;
  final SafeList<Material> materials;
  final SafeList<Mesh> meshes;
  final SafeList<Node> nodes;
  final SafeList<Sampler> samplers;
  final int _sceneIndex;
  final Scene scene;
  final SafeList<Scene> scenes;
  final SafeList<Skin> skins;
  final SafeList<Texture> textures;

  Gltf._(
      this.extensionsUsed,
      this.extensionsRequired,
      this.accessors,
      this.animations,
      this.asset,
      this.buffers,
      this.bufferViews,
      this.cameras,
      this.images,
      this.materials,
      this.meshes,
      this.nodes,
      this.samplers,
      this._sceneIndex,
      this.scene,
      this.scenes,
      this.skins,
      this.textures,
      Map<String, Object> extensions,
      Object extras)
      : super(extensions, extras);

  factory Gltf.fromMap(Map<String, Object> map, Context context) {
    void resetPath() => context.path.clear();

    resetPath();
    if (context.validate) {
      checkMembers(map, GLTF_MEMBERS, context);
    }

    final extensionsUsed = getStringList(map, EXTENSIONS_USED, context);
    context.initExtensions(extensionsUsed);

    final extensionsRequired = getStringList(map, EXTENSIONS_REQUIRED, context);

    if (context.validate) {
      // See https://github.com/KhronosGroup/glTF/pull/1025
      if (map.containsKey(EXTENSIONS_REQUIRED) &&
          !map.containsKey(EXTENSIONS_USED)) {
        context.addIssue(SchemaError.unsatisfiedDependency,
            name: EXTENSIONS_REQUIRED, args: [EXTENSIONS_USED]);
      }

      for (final value in extensionsRequired) {
        if (!extensionsUsed.contains(value)) {
          context.addIssue(SemanticError.unusedExtensionRequired,
              name: EXTENSIONS_REQUIRED, args: [value]);
        }
      }
    }

    // Helper function for converting JSON array to List of proper glTF objects
    SafeList<T> toSafeList<T>(String name, FromMapFunction<T> fromMap) {
      if (!map.containsKey(name)) {
        return new SafeList<T>.empty();
      }

      resetPath();

      final itemsList = map[name];
      if (itemsList is List<Object>) {
        if (itemsList.isNotEmpty) {
          final items = new SafeList<T>(itemsList.length);
          context.path.add(name);
          for (var i = 0; i < itemsList.length; i++) {
            final itemMap = itemsList[i];
            if (itemMap is Map<String, Object>) {
              // JSON mandates all keys to be string
              context.path.add(i.toString());
              items[i] = fromMap(itemMap, context);
              context.path.removeLast();
            } else {
              context.addIssue(SchemaError.typeMismatch,
                  index: i, args: [itemMap, 'JSON object']);
            }
          }
          return items;
        } else {
          context.addIssue(SchemaError.emptyEntity, name: name);
          return new SafeList<T>.empty();
        }
      } else {
        context.addIssue(SchemaError.typeMismatch,
            name: name, args: [itemsList, 'JSON array']);
        return new SafeList<T>.empty();
      }
    }

    // Helper function for converting JSON dictionary to proper glTF object
    T toValue<T>(String name, FromMapFunction<T> fromMap, {bool req: false}) {
      resetPath();
      final item = getMap(map, name, context, req: req);
      if (item == null) {
        return null;
      }
      context.path.add(name);
      return fromMap(item, context);
    }

    final asset = toValue<Asset>(ASSET, Asset.fromMap, req: true);

    if (asset == null) {
      return null;
    } else if (asset.majorVersion != 2) {
      context.addIssue(SemanticError.unknownAssetMajorVersion,
          args: [asset?.majorVersion]);
      return null;
    } else if (asset.minorVersion > 0) {
      context.addIssue(SemanticError.unknownAssetMinorVersion,
          args: [asset?.minorVersion]);
    }

    final accessors = toSafeList<Accessor>(ACCESSORS, Accessor.fromMap);

    final animations = toSafeList<Animation>(ANIMATIONS, Animation.fromMap);

    final buffers = toSafeList<Buffer>(BUFFERS, Buffer.fromMap);

    final bufferViews =
        toSafeList<BufferView>(BUFFER_VIEWS, BufferView.fromMap);

    final cameras = toSafeList<Camera>(CAMERAS, Camera.fromMap);

    final images = toSafeList<Image>(IMAGES, Image.fromMap);

    final materials = toSafeList<Material>(MATERIALS, Material.fromMap);

    final meshes = toSafeList<Mesh>(MESHES, Mesh.fromMap);

    final nodes = toSafeList<Node>(NODES, Node.fromMap);

    final samplers = toSafeList<Sampler>(SAMPLERS, Sampler.fromMap);

    final scenes = toSafeList<Scene>(SCENES, Scene.fromMap);

    resetPath();
    final sceneIndex = getIndex(map, SCENE, context, req: false);
    final scene = scenes[sceneIndex];

    if (context.validate && sceneIndex != -1 && scene == null)
      context.addIssue(LinkError.unresolvedReference,
          name: SCENE, args: [sceneIndex]);

    final skins = toSafeList<Skin>(SKINS, Skin.fromMap);

    final textures = toSafeList<Texture>(TEXTURES, Texture.fromMap);

    resetPath();

    final gltf = new Gltf._(
        extensionsUsed,
        extensionsRequired,
        accessors,
        animations,
        asset,
        buffers,
        bufferViews,
        cameras,
        images,
        materials,
        meshes,
        nodes,
        samplers,
        sceneIndex,
        scene,
        scenes,
        skins,
        textures,
        getExtensions(map, Gltf, context),
        getExtras(map));

    // Step 2: linking IDs
    void linkCollection(String key, SafeList<GltfProperty> list) {
      context.path.add(key);
      list.forEachWithIndices((i, item) {
        context.path.add(i.toString());
        item.link(gltf, context);

        if (context.extensionsLoaded.isNotEmpty && item.extensions.isNotEmpty) {
          context.path.add(EXTENSIONS);
          item.extensions.forEach((name, extension) {
            if (extension is GltfProperty) {
              context.path.add(name);
              extension.link(gltf, context);
              context.path.removeLast();
            }
          });
          context.path.removeLast();
        }
        context.path.removeLast();
      });
      context.path.removeLast();
    }

    // Fixed order
    linkCollection(BUFFER_VIEWS, bufferViews);

    linkCollection(ACCESSORS, accessors);

    linkCollection(IMAGES, images);
    linkCollection(TEXTURES, textures);
    linkCollection(MATERIALS, materials);

    linkCollection(MESHES, meshes);

    linkCollection(NODES, nodes);
    linkCollection(SKINS, skins);

    linkCollection(ANIMATIONS, animations);
    linkCollection(SCENES, scenes);

    // Check node tree loops
    if (context.validate) {
      context.path.add(NODES);
      final seenNodes = new Set<Node>();
      Node temp;
      gltf.nodes.forEachWithIndices((i, node) {
        if (!node.isJoint &&
            node.children == null &&
            node.mesh == null &&
            node.camera == null &&
            node.extensions.isEmpty &&
            node.extras == null) {
          context.addIssue(SemanticError.nodeEmpty, index: i);
        }

        if (node.parent == null) {
          return;
        }
        seenNodes.clear();
        temp = node;
        while (temp.parent != null) {
          if (seenNodes.add(temp)) {
            temp = temp.parent;
          } else {
            if (temp == node) {
              context.addIssue(LinkError.nodeLoop, index: i);
            }
            break;
          }
        }
      });
      context.path.removeLast();
    }

    return gltf;
  }

  @override
  String toString([_]) => super.toString({
        ASSET: asset,
        ACCESSORS: accessors,
        ANIMATIONS: animations,
        BUFFERS: buffers,
        BUFFER_VIEWS: bufferViews,
        CAMERAS: cameras,
        IMAGES: images,
        MATERIALS: materials,
        MESHES: meshes,
        NODES: nodes,
        SAMPLERS: samplers,
        SCENES: scenes,
        SCENE: _sceneIndex,
        SKINS: skins,
        TEXTURES: textures,
        EXTENSIONS_REQUIRED: extensionsRequired,
        EXTENSIONS_USED: extensionsUsed
      });
}

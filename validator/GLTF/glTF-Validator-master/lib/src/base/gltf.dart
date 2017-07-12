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

library gltf.core.gltf;

import 'dart:math';

import 'package:gltf/src/gl.dart' as gl;

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
import 'program.dart';
import 'sampler.dart';
import 'scene.dart';
import 'shader.dart';
import 'skin.dart';
import 'technique.dart';
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
export 'program.dart';
export 'sampler.dart';
export 'scene.dart';
export 'shader.dart';
export 'skin.dart';
export 'technique.dart';
export 'texture.dart';

class Gltf extends GltfProperty {
  final List<String> extensionsUsed;
  final List<String> extensionsRequired;
  final List<String> glExtensionsUsed;
  final Map<String, Accessor> accessors;
  final Map<String, Animation> animations;
  final Asset asset;
  final Map<String, Buffer> buffers;
  final Map<String, BufferView> bufferViews;
  final Map<String, Camera> cameras;
  final Map<String, Image> images;
  final Map<String, Material> materials;
  final Map<String, Mesh> meshes;
  final Map<String, Node> nodes;
  final Map<String, Program> programs;
  final Map<String, Sampler> samplers;
  final String sceneId;
  final Scene scene;
  final Map<String, Scene> scenes;
  final Map<String, Shader> shaders;
  final Map<String, Skin> skins;
  final Map<String, Technique> techniques;
  final Map<String, Texture> textures;

  final Map<String, Node> joints = <String, Node>{};

  Gltf._(
      this.extensionsUsed,
      this.extensionsRequired,
      this.glExtensionsUsed,
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
      this.programs,
      this.samplers,
      this.sceneId,
      this.scene,
      this.scenes,
      this.shaders,
      this.skins,
      this.techniques,
      this.textures,
      Map<String, Object> extensions,
      Object extras)
      : super(extensions, extras);

  factory Gltf.fromMap(Map<String, Object> map, Context context) {
    void resetPath() {
      context.path
        ..clear()
        ..add("");
    }

    resetPath();
    if (context.validate) checkMembers(map, GLTF_MEMBERS, context);

    // Prepare glTF extensions handlers
    final extensionsUsed =
        getStringList(map, EXTENSIONS_USED, context, def: <String>[]);
    context.initExtensions(extensionsUsed ?? <String>[]);

    if (context.validate && extensionsUsed != null) {
      checkDuplicates(extensionsUsed, EXTENSIONS_USED, context);
    }

    final extensionsRequired =
        getStringList(map, EXTENSIONS_REQUIRED, context, def: <String>[]);

    if (context.validate && extensionsRequired != null) {
      checkDuplicates(extensionsRequired, EXTENSIONS_REQUIRED, context);
      for (final value in extensionsRequired) {
        // Explicit check to handle null
        if (extensionsUsed?.contains(value) != true) {
          context.addIssue(GltfWarning.UNUSED_EXTENSION_REQUIRED,
              name: EXTENSIONS_REQUIRED, args: [value]);
        }
      }
    }

    // Get used GL extensions and store valid in the current `context`.
    const glExtensionsUsedEnum = const <String>[gl.OES_ELEMENT_INDEX_UINT];

    final glExtensionsUsed = getStringList(map, GL_EXTENSIONS_USED, context,
        list: glExtensionsUsedEnum, def: <String>[]);

    context.initGlExtensions(glExtensionsUsed ?? <String>[]);

    // Helper function for converting JSON dictionary to Map of proper glTF objects
    Map<String, dynamic/*=T*/ > toMap/*<T>*/(
        String name, FromMapFunction fromMap,
        {bool req: false}) {
      resetPath();

      final itemMaps = getMap(map, name, context, req: req);

      if (itemMaps != null) {
        if (itemMaps.isNotEmpty) {
          final items = <String, dynamic/*=T*/ >{};
          context.path.add(name);
          for (final id in itemMaps.keys) {
            final itemMap = getMap(itemMaps, id, context, req: true);
            if (itemMap == null) continue;
            context.path.add(id);
            items[id] = fromMap(itemMap, context) as dynamic/*=T*/;
            context.path.removeLast();
          }
          return items;
        } else {
          if (req)
            context.addIssue(GltfError.ROOT_DICTIONARY_EMPTY, name: name);
          return <String, dynamic/*=T*/ >{};
        }
      } else {
        return <String, dynamic/*=T*/ >{};
      }
    }

    // Helper function for converting JSON dictionary to proper glTF object
    Object/*=T*/ toValue/*<T>*/(String name, FromMapFunction fromMap,
        {bool req: false}) {
      resetPath();
      final item = getMap(map, name, context, req: req);
      if (item == null) return null;
      context.path.add(name);
      return fromMap(item, context) as dynamic/*=T*/;
    }

    final asset = toValue/*<Asset>*/(ASSET, Asset.fromMap, req: true);

    final accessors =
        toMap/*<Accessor>*/(ACCESSORS, Accessor.fromMap, req: true);

    final animations = toMap/*<Animation>*/(ANIMATIONS, Animation.fromMap);

    final Map<String, Buffer> buffers =
        toMap/*<Buffer>*/(BUFFERS, Buffer.fromMap, req: true);

    final bufferViews =
        toMap/*<BufferView>*/(BUFFER_VIEWS, BufferView.fromMap, req: true);

    final cameras = toMap/*<Camera>*/(CAMERAS, Camera.fromMap);

    final images = toMap/*<Image>*/(IMAGES, Image.fromMap);

    final materials = toMap/*<Material>*/(MATERIALS, Material.fromMap);

    final meshes = toMap/*<Mesh>*/(MESHES, Mesh.fromMap, req: true);

    final nodes = toMap/*<Node>*/(NODES, Node.fromMap);

    final programs = toMap/*<Program>*/(PROGRAMS, Program.fromMap);

    final samplers = toMap/*<Sampler>*/(SAMPLERS, Sampler.fromMap);

    final scenes = toMap/*<Scene>*/(SCENES, Scene.fromMap);

    final sceneId = getId(map, SCENE, context, req: false);

    final scene = scenes[sceneId];

    if (context.validate && sceneId != null && scene == null)
      context.addIssue(GltfError.UNRESOLVED_REFERENCE,
          name: SCENE, args: [sceneId]);

    final shaders = toMap/*<Shader>*/(SHADERS, Shader.fromMap);

    final skins = toMap/*<Skin>*/(SKINS, Skin.fromMap);

    final techniques = toMap/*<Technique>*/(TECHNIQUES, Technique.fromMap);

    final Map<String, Texture> textures =
        toMap/*<Texture>*/(TEXTURES, Texture.fromMap);

    resetPath();

    final gltf = new Gltf._(
        extensionsUsed,
        extensionsRequired,
        glExtensionsUsed,
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
        programs,
        samplers,
        sceneId,
        scene,
        scenes,
        shaders,
        skins,
        techniques,
        textures,
        getExtensions(map, Gltf, context),
        getExtras(map));

    // Step 2: linking IDs
    final topLevelMaps = <String, Map<String, GltfProperty>>{
      ACCESSORS: accessors,
      ANIMATIONS: animations,
      BUFFER_VIEWS: bufferViews,
      MATERIALS: materials,
      PROGRAMS: programs,
      TECHNIQUES: techniques,
      TEXTURES: textures
    };

    void linkCollection(String key, Map<String, GltfProperty> collection) {
      context.path.add(key);
      collection.forEach((id, GltfProperty item) {
        context.path.add(id);
        if (item is Linkable)
          (item as dynamic/*=Linkable*/).link(gltf, context);
        if (item.extensions.isNotEmpty) {
          context.path.add(EXTENSIONS);
          item.extensions.forEach((name, extension) {
            context.path.add(name);
            if (extension is Linkable) extension.link(gltf, context);
            context.path.removeLast();
          });
          context.path.removeLast();
        }
        context.path.removeLast();
      });
      context.path.removeLast();
    }

    topLevelMaps.forEach(linkCollection);

    // Fixed order
    linkCollection(NODES, nodes);
    linkCollection(SKINS, skins);
    linkCollection(MESHES, meshes);
    linkCollection(SCENES, scenes);

    // Check node tree loops
    if (context.validate) {
      context.path.add(NODES);
      final seenNodes = new Set<Node>();
      Node temp;
      gltf.nodes.forEach((id, node) {
        if (node.parent == null) return;
        seenNodes.clear();
        temp = node;
        while (true) {
          if (temp.parent == null) break;
          if (seenNodes.add(temp)) {
            temp = temp.parent;
          } else {
            if (temp == node) context.addIssue(GltfError.NODE_LOOP, name: id);
            break;
          }
        }
      });
      context.path.removeLast();
    }

    return gltf;
  }

  Map<String, Object> get info {
    final info = <String, Object>{};

    info[VERSION] = asset?.version;
    if (extensionsUsed.isNotEmpty) info[EXTENSIONS_USED] = extensionsUsed;
    if (extensionsRequired.isNotEmpty) {
      info[EXTENSIONS_REQUIRED] = extensionsRequired;
    }
    if (glExtensionsUsed.isNotEmpty)
      info[GL_EXTENSIONS_USED] = glExtensionsUsed;

    final externalResources = <String, List<String>>{};

    final externalBuffers = <String>[];
    for (final buffer in buffers.values) {
      if (buffer.uri != null) externalBuffers.add(buffer.uri.toString());
    }
    if (externalBuffers.isNotEmpty)
      externalResources["buffers"] = externalBuffers;

    final externalImages = <String>[];
    for (final image in images.values) {
      if (image.uri != null) externalImages.add(image.uri.toString());
    }
    if (externalImages.isNotEmpty) externalResources["images"] = externalImages;

    final externalShaders = <String>[];
    for (final shader in shaders.values) {
      if (shader.uri != null) externalShaders.add(shader.uri.toString());
    }
    if (externalShaders.isNotEmpty) {
      externalResources["shaders"] = externalShaders;
    }

    if (externalResources.isNotEmpty) {
      info["externalResources"] = externalResources;
    }

    info["hasAnimations"] = animations.isNotEmpty;
    info["hasMaterials"] = materials.isNotEmpty;
    info["hasSkins"] = skins.isNotEmpty;
    info["hasTextures"] = textures.isNotEmpty;

    int primitivesCount = 0;
    int maxAttributesUsed = 0;
    for (final mesh in meshes.values) {
      if (mesh.primitives != null) {
        primitivesCount += mesh.primitives.length;
        for (final primitive in mesh.primitives) {
          maxAttributesUsed =
              max(maxAttributesUsed, primitive.attributes.length);
        }
      }
    }
    info["primitivesCount"] = primitivesCount;
    info["maxAttributesUsed"] = maxAttributesUsed;

    info["programsCount"] = programs.length;

    int maxUniformsUsed = 0;
    for (final technique in techniques.values) {
      maxUniformsUsed = max(maxUniformsUsed, technique.uniforms.length);
    }
    info["maxUniformsUsed"] = maxUniformsUsed;

    return info;
  }
}

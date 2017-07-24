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

library gltf.base.material;

import 'gltf_property.dart';

class Material extends GltfChildOfRootProperty {
  final PbrMetallicRoughness pbrMetallicRoughness;
  final NormalTextureInfo normalTexture;
  final OcclusionTextureInfo occlusionTexture;
  final TextureInfo emissiveTexture;
  final List<double> emissiveFactor;
  final String alphaMode;
  final double alphaCutoff;
  final bool doubleSided;

  Material._(
      this.pbrMetallicRoughness,
      this.normalTexture,
      this.occlusionTexture,
      this.emissiveTexture,
      this.emissiveFactor,
      this.alphaMode,
      this.alphaCutoff,
      this.doubleSided,
      String name,
      Map<String, Object> extensions,
      Object extras)
      : super(name, extensions, extras);

  @override
  String toString([_]) => super.toString({
        PBR_METALLIC_ROUGHNESS: pbrMetallicRoughness,
        NORMAL_TEXTURE: normalTexture,
        OCCLUSION_TEXTURE: occlusionTexture,
        EMISSIVE_TEXTURE: emissiveTexture,
        EMISSIVE_FACTOR: emissiveFactor,
        ALPHA_MODE: alphaMode,
        ALPHA_CUTOFF: alphaCutoff,
        DOUBLE_SIDED: doubleSided
      });

  static Material fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, MATERIAL_MEMBERS, context);
    }

    final pbrMetallicRoughness = getObjectFromInnerMap<PbrMetallicRoughness>(
        map, PBR_METALLIC_ROUGHNESS, context, PbrMetallicRoughness.fromMap);
    final normalTexture = getObjectFromInnerMap<NormalTextureInfo>(
        map, NORMAL_TEXTURE, context, NormalTextureInfo.fromMap);
    final occlusionTexture = getObjectFromInnerMap<OcclusionTextureInfo>(
        map, OCCLUSION_TEXTURE, context, OcclusionTextureInfo.fromMap);
    final emissiveTexture = getObjectFromInnerMap<TextureInfo>(
        map, EMISSIVE_TEXTURE, context, TextureInfo.fromMap);
    final emissiveFactor = getFloatList(map, EMISSIVE_FACTOR, context,
        lengthsList: const [3], min: 0.0, max: 1.0, def: [0.0, 0.0, 0.0]);
    final alphaMode = getString(map, ALPHA_MODE, context,
        def: OPAQUE, list: MATERIAL_ALPHA_MODES);
    final alphaCutoff =
        getFloat(map, ALPHA_CUTOFF, context, min: 0.0, def: 0.5);
    final doubleSided = getBool(map, DOUBLE_SIDED, context);

    return new Material._(
        pbrMetallicRoughness,
        normalTexture,
        occlusionTexture,
        emissiveTexture,
        emissiveFactor,
        alphaMode,
        alphaCutoff,
        doubleSided,
        getName(map, context),
        getExtensions(map, Material, context),
        getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    void linkWithPath(GltfProperty property, String name) {
      if (property != null) {
        context.path.add(name);
        property.link(gltf, context);
        context.path.removeLast();
      }
    }

    linkWithPath(pbrMetallicRoughness, PBR_METALLIC_ROUGHNESS);
    linkWithPath(normalTexture, NORMAL_TEXTURE);
    linkWithPath(occlusionTexture, OCCLUSION_TEXTURE);
    linkWithPath(emissiveTexture, EMISSIVE_TEXTURE);
  }
}

class PbrMetallicRoughness extends GltfProperty {
  final List<double> baseColorFactor;
  final TextureInfo baseColorTexture;

  final double metallicFactor;
  final double roughnessFactor;
  final TextureInfo metallicRoughnessTexture;

  PbrMetallicRoughness._(
      this.baseColorFactor,
      this.baseColorTexture,
      this.metallicFactor,
      this.roughnessFactor,
      this.metallicRoughnessTexture,
      Map<String, Object> extensions,
      Object extras)
      : super(extensions, extras);

  @override
  String toString([_]) => super.toString({
        BASE_COLOR_FACTOR: baseColorFactor,
        BASE_COLOR_TEXTURE: baseColorTexture,
        METALLIC_FACTOR: metallicFactor,
        ROUGHNESS_FACTOR: roughnessFactor,
        METALLIC_ROUGHNESS_TEXTURE: metallicRoughnessTexture
      });

  static PbrMetallicRoughness fromMap(
      Map<String, Object> map, Context context) {
    if (context.validate)
      checkMembers(map, PBR_METALLIC_ROUGHNESS_MEMBERS, context);

    final baseColorFactor = getFloatList(map, BASE_COLOR_FACTOR, context,
        lengthsList: const [4], min: 0.0, max: 1.0, def: [1.0, 1.0, 1.0, 1.0]);
    final baseColorTexture = getObjectFromInnerMap<TextureInfo>(
        map, BASE_COLOR_TEXTURE, context, TextureInfo.fromMap);
    final metallicFactor =
        getFloat(map, METALLIC_FACTOR, context, min: 0.0, max: 1.0, def: 1.0);
    final roughnessFactor =
        getFloat(map, ROUGHNESS_FACTOR, context, min: 0.0, max: 1.0, def: 1.0);
    final metallicRoughnessTexture = getObjectFromInnerMap<TextureInfo>(
        map, METALLIC_ROUGHNESS_TEXTURE, context, TextureInfo.fromMap);

    return new PbrMetallicRoughness._(
        baseColorFactor,
        baseColorTexture,
        metallicFactor,
        roughnessFactor,
        metallicRoughnessTexture,
        getExtensions(map, PbrMetallicRoughness, context),
        getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    if (baseColorTexture != null) {
      context.path.add(BASE_COLOR_TEXTURE);
      baseColorTexture.link(gltf, context);
      context.path.removeLast();
    }

    if (metallicRoughnessTexture != null) {
      context.path.add(METALLIC_ROUGHNESS_TEXTURE);
      metallicRoughnessTexture.link(gltf, context);
      context.path.removeLast();
    }
  }
}

class OcclusionTextureInfo extends TextureInfo {
  final double strength;

  OcclusionTextureInfo._(int index, int texCoord, this.strength,
      Map<String, Object> extensions, Object extras)
      : super._(index, texCoord, extensions, extras);

  @override
  String toString([_]) => super.toString({STRENGTH: strength});

  static OcclusionTextureInfo fromMap(
      Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, OCCLUSION_TEXTURE_INFO_MEMBERS, context);
    }

    return new OcclusionTextureInfo._(
        getIndex(map, INDEX, context),
        getUint(map, TEX_COORD, context, def: 0, min: 0),
        getFloat(map, STRENGTH, context, min: 0.0, max: 1.0, def: 1.0),
        getExtensions(map, OcclusionTextureInfo, context),
        getExtras(map));
  }
}

class NormalTextureInfo extends TextureInfo {
  final double scale;

  NormalTextureInfo._(int index, int texCoord, this.scale,
      Map<String, Object> extensions, Object extras)
      : super._(index, texCoord, extensions, extras);

  @override
  String toString([_]) => super.toString({SCALE: scale});

  static NormalTextureInfo fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, NORMAL_TEXTURE_INFO_MEMBERS, context);
    }

    return new NormalTextureInfo._(
        getIndex(map, INDEX, context),
        getUint(map, TEX_COORD, context, def: 0, min: 0),
        getFloat(map, SCALE, context, def: 1.0),
        getExtensions(map, NormalTextureInfo, context),
        getExtras(map));
  }
}

class TextureInfo extends GltfProperty {
  final int _index;
  final int texCoord;

  Texture _texture;

  TextureInfo._(
      this._index, this.texCoord, Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  Texture get texture => _texture;

  @override
  String toString([Map<String, Object> map]) {
    map ??= <String, Object>{};
    map[INDEX] = _index;
    map[TEX_COORD] = texCoord;

    return super.toString(map);
  }

  static TextureInfo fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, TEXTURE_INFO_MEMBERS, context);
    }

    return new TextureInfo._(
        getIndex(map, INDEX, context),
        getUint(map, TEX_COORD, context, def: 0, min: 0),
        getExtensions(map, TextureInfo, context),
        getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    _texture = gltf.textures[_index];

    if (context.validate && _index != -1 && _texture == null) {
      context
          .addIssue(LinkError.unresolvedReference, name: INDEX, args: [_index]);
    }
  }
}

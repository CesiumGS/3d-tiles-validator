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

library gltf.extensions.khr_materials_pbr_specular_glossiness;

import 'package:gltf/src/utils.dart';
import 'package:gltf/src/base/gltf_property.dart';
import 'package:gltf/src/ext/extensions.dart';

const String KHR_MATERIALS_PBRSPECULARGLOSSINESS =
    'KHR_materials_pbrSpecularGlossiness';

const String DIFFUSE_FACTOR = 'diffuseFactor';
const String DIFFUSE_TEXTURE = 'diffuseTexture';
const String SPECULAR_FACTOR = 'specularFactor';
const String GLOSSINESS_FACTOR = 'glossinessFactor';
const String SPECULAR_GLOSSINESS_TEXTURE = 'specularGlossinessTexture';

const List<String> KHR_MATERIALS_PBRSPECULARGLOSSINESS_MEMBERS = const <String>[
  DIFFUSE_FACTOR,
  DIFFUSE_TEXTURE,
  SPECULAR_FACTOR,
  GLOSSINESS_FACTOR,
  SPECULAR_GLOSSINESS_TEXTURE
];

class KhrMaterialsPbrSpecularGlossiness extends GltfProperty {
  final List<double> diffuseFactor;
  final TextureInfo diffuseTexture;

  final List<double> specularFactor;
  final double glossinessFactor;
  final TextureInfo specularGlossinessTexture;

  KhrMaterialsPbrSpecularGlossiness._(
      this.diffuseFactor,
      this.diffuseTexture,
      this.specularFactor,
      this.glossinessFactor,
      this.specularGlossinessTexture,
      Map<String, Object> extensions,
      Object extras)
      : super(extensions, extras);

  @override
  String toString([_]) => super.toString({
        DIFFUSE_FACTOR: diffuseFactor,
        DIFFUSE_TEXTURE: diffuseTexture,
        SPECULAR_FACTOR: specularFactor,
        GLOSSINESS_FACTOR: glossinessFactor,
        SPECULAR_GLOSSINESS_TEXTURE: specularGlossinessTexture
      });

  static KhrMaterialsPbrSpecularGlossiness fromMap(
      Map<String, Object> map, Context context) {
    if (context.validate)
      checkMembers(map, KHR_MATERIALS_PBRSPECULARGLOSSINESS_MEMBERS, context);

    final diffuseFactor = getFloatList(map, DIFFUSE_FACTOR, context,
        lengthsList: const [4], min: 0.0, max: 1.0, def: [1.0, 1.0, 1.0, 1.0]);
    final diffuseTexture = getObjectFromInnerMap<TextureInfo>(
        map, DIFFUSE_TEXTURE, context, TextureInfo.fromMap);
    final specularFactor = getFloatList(map, SPECULAR_FACTOR, context,
        lengthsList: const [3], min: 0.0, max: 1.0, def: [1.0, 1.0, 1.0]);
    final glossinessFactor =
        getFloat(map, GLOSSINESS_FACTOR, context, min: 0.0, max: 1.0, def: 1.0);
    final specularGlossinessTexture = getObjectFromInnerMap<TextureInfo>(
        map, SPECULAR_GLOSSINESS_TEXTURE, context, TextureInfo.fromMap);

    return new KhrMaterialsPbrSpecularGlossiness._(
        diffuseFactor,
        diffuseTexture,
        specularFactor,
        glossinessFactor,
        specularGlossinessTexture,
        getExtensions(map, KhrMaterialsPbrSpecularGlossiness, context),
        getExtras(map));
  }

  @override
  void link(Gltf gltf, Context context) {
    if (diffuseTexture != null) {
      context.path.add(DIFFUSE_TEXTURE);
      diffuseTexture.link(gltf, context);
      context.path.removeLast();
    }

    if (specularGlossinessTexture != null) {
      context.path.add(SPECULAR_GLOSSINESS_TEXTURE);
      specularGlossinessTexture.link(gltf, context);
      context.path.removeLast();
    }
  }
}

class KhrMaterialsPbrSpecularGlossinessExtension extends Extension {
  @override
  final String name = KHR_MATERIALS_PBRSPECULARGLOSSINESS;

  @override
  final Map<Type, ExtFuncs> functions = <Type, ExtFuncs>{
    Material: const ExtFuncs(KhrMaterialsPbrSpecularGlossiness.fromMap, null)
  };

  factory KhrMaterialsPbrSpecularGlossinessExtension() => _singleton;

  static final KhrMaterialsPbrSpecularGlossinessExtension _singleton =
      new KhrMaterialsPbrSpecularGlossinessExtension._();
  KhrMaterialsPbrSpecularGlossinessExtension._();
}

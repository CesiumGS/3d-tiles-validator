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

library gltf.core.asset;

import 'gltf_property.dart';

class Asset extends GltfProperty {
  final String copyright;
  final String generator;
  final bool premultipliedAlpha;
  final AssetProfile profile;
  final String version;

  Asset._(this.copyright, this.generator, this.premultipliedAlpha, this.profile,
      this.version, Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString({
        COPYRIGHT: copyright,
        GENERATOR: generator,
        PREMULTIPLIED_ALPHA: premultipliedAlpha,
        PROFILE: profile,
        VERSION: version
      });

  static Asset fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, ASSET_MEMBERS, context);

    final profileMap = getMap(map, PROFILE, context);
    context.path.add(PROFILE);
    final profile = AssetProfile.fromMap(profileMap, context);
    context.path.removeLast();

    return new Asset._(
        getString(map, COPYRIGHT, context),
        getString(map, GENERATOR, context),
        getBool(map, PREMULTIPLIED_ALPHA, context, def: false),
        profile,
        getString(map, VERSION, context, req: true, list: ["1.1"]),
        getExtensions(map, Asset, context),
        getExtras(map));
  }
}

class AssetProfile extends GltfProperty {
  static const String WEBGL = "WebGL";
  static const String V1_0 = "1.0";
  static final RegExp versionRegexp = new RegExp(r"^\d+\.\d+$");

  final String api;
  final String version;

  AssetProfile._(
      this.api, this.version, Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString({API: api, VERSION: version});

  static AssetProfile fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, ASSET_PROFILE_MEMBERS, context);

    return new AssetProfile._(
        getString(map, API, context, def: WEBGL),
        getString(map, VERSION, context, regexp: versionRegexp, def: V1_0),
        getExtensions(map, AssetProfile, context),
        getExtras(map));
  }
}

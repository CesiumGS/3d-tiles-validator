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

library gltf.base.asset;

import 'gltf_property.dart';

class Asset extends GltfProperty {
  static final RegExp versionRegexp = new RegExp(r'^([0-9]+)\.([0-9]+)$');

  final String copyright;
  final String generator;
  final String version;
  final String minVersion;

  Asset._(this.copyright, this.generator, this.version, this.minVersion,
      Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  @override
  String toString([_]) => super.toString({
        COPYRIGHT: copyright,
        GENERATOR: generator,
        VERSION: version,
        MIN_VERSION: minVersion
      });

  int get majorVersion {
    if (version == null || !versionRegexp.hasMatch(version)) {
      return 0;
    }
    return int.parse(versionRegexp.firstMatch(version).group(1));
  }

  int get minorVersion {
    if (version == null || !versionRegexp.hasMatch(version)) {
      return 0;
    }
    return int.parse(versionRegexp.firstMatch(version).group(2));
  }

  int get majorMinVersion {
    if (minVersion == null || !versionRegexp.hasMatch(minVersion)) {
      return 2;
    }
    return int.parse(versionRegexp.firstMatch(minVersion).group(1));
  }

  int get minorMinVersion {
    if (minVersion == null || !versionRegexp.hasMatch(minVersion)) {
      return 0;
    }
    return int.parse(versionRegexp.firstMatch(minVersion).group(2));
  }

  static Asset fromMap(Map<String, Object> map, Context context) {
    if (context.validate) {
      checkMembers(map, ASSET_MEMBERS, context);
    }

    final asset = new Asset._(
        getString(map, COPYRIGHT, context),
        getString(map, GENERATOR, context),
        getString(map, VERSION, context, req: true, regexp: versionRegexp),
        getString(map, MIN_VERSION, context, regexp: versionRegexp),
        getExtensions(map, Asset, context),
        getExtras(map));

    if (context.validate && asset.minVersion != null) {
      // Check that minVersion isn't greater than version
      if (asset.majorMinVersion > asset.majorVersion ||
          (asset.majorMinVersion == asset.majorVersion &&
              asset.minorMinVersion > asset.minorVersion)) {
        context.addIssue(SemanticError.minVersionGreaterThanVersion,
            name: MIN_VERSION, args: [asset.minVersion, asset.version]);
      }
    }

    return asset;
  }
}

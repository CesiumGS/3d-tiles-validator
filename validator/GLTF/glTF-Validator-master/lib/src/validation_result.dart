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
library gltf.validation_result;

import 'dart:math';
import 'package:gltf/src/base/members.dart';
import 'package:gltf/src/context.dart';

import 'package:gltf/src/errors.dart';
import 'package:gltf/src/gltf_reader.dart';

class ValidationResult {
  final Uri absoluteUri;
  final Context context;
  final GltfReaderResult readerResult;
  final List<Map<String, Object>> _resources = <Map<String, Object>>[];

  ValidationResult(this.absoluteUri, this.context, this.readerResult);

  Map<String, Object> toJson() {
    final reportMap = <String, Object>{
      URI: absoluteUri.toString(),
      MIME_TYPE: readerResult?.mimeType
    };

    void flushIssues(String key, Iterable<Issue> issues) {
      if (issues.isNotEmpty) {
        final map = <String, List<Map<String, String>>>{};

        for (final issue in issues.map((issue) => issue.toMap())) {
          map.putIfAbsent(issue['type'], () => <Map<String, String>>[]);
          map[issue['type']].add(issue);
        }

        reportMap[key] = map;
      }
    }

    flushIssues('errors', context.errors);
    flushIssues('warnings', context.warnings);

    if (_resources.isNotEmpty) {
      reportMap['resources'] = _resources;
    }

    reportMap['info'] = _getGltfInfo();

    return reportMap;
  }

  Map<String, Object> _getGltfInfo() {
    final root = readerResult?.gltf;
    if (root == null) {
      return null;
    }

    final info = <String, Object>{};

    info[VERSION] = root.asset?.version;
    info[GENERATOR] = root.asset?.generator;
    if (root.extensionsUsed.isNotEmpty)
      info[EXTENSIONS_USED] = root.extensionsUsed;
    if (root.extensionsRequired.isNotEmpty) {
      info[EXTENSIONS_REQUIRED] = root.extensionsRequired;
    }

    final externalResources = <String, Map<String, String>>{};

    final externalBuffers = <String, String>{};
    root.buffers.forEachWithIndices((index, buffer) {
      if (buffer.uri != null)
        externalBuffers['#/buffers/$index'] = buffer.uri.toString();
    });

    if (externalBuffers.isNotEmpty)
      externalResources[BUFFERS] = externalBuffers;

    final externalImages = <String, String>{};
    root.images.forEachWithIndices((index, image) {
      if (image.uri != null)
        externalImages['#/images/$index'] = image.uri.toString();
    });
    if (externalImages.isNotEmpty) {
      externalResources[IMAGES] = externalImages;
    }

    if (externalResources.isNotEmpty) {
      info['externalResources'] = externalResources;
    }

    info['hasAnimations'] = root.animations.isNotEmpty;
    info['hasMaterials'] = root.materials.isNotEmpty;
    info['hasMorphTargets'] = root.meshes.any((mesh) =>
        mesh.primitives != null &&
        mesh.primitives.any((primitive) => primitive.targets != null));
    info['hasSkins'] = root.skins.isNotEmpty;
    info['hasTextures'] = root.textures.isNotEmpty;
    info['hasDefaultScene'] = root.scene != null;

    var primitivesCount = 0;
    var maxAttributesUsed = 0;
    for (final mesh in root.meshes) {
      if (mesh.primitives != null) {
        primitivesCount += mesh.primitives.length;
        for (final primitive in mesh.primitives) {
          maxAttributesUsed =
              max(maxAttributesUsed, primitive.attributes.length);
        }
      }
    }
    info['primitivesCount'] = primitivesCount;
    info['maxAttributesUsed'] = maxAttributesUsed;

    return info;
  }

  void addResource(Map<String, Object> info) => _resources.add(info);
}

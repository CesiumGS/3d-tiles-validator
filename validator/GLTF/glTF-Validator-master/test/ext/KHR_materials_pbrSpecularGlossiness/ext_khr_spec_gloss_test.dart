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

import 'dart:io';

import 'package:test/test.dart';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/errors.dart';

void main() {
  group('KHR_materials_pbrSpecularGlossiness', () {
    test('Empty object', () async {
      final reader = new GltfJsonReader(new File('test/ext/'
              'KHR_materials_pbrSpecularGlossiness/data/empty_object.gltf')
          .openRead());

      await reader.read();

      final context = new Context()
        ..path.add('materials')
        ..path.add('0')
        ..path.add('extensions')
        ..addIssue(LinkError.undeclaredExtension,
            name: 'KHR_materials_pbrSpecularGlossiness')
        ..path.add('KHR_materials_pbrSpecularGlossiness');

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Custom Property', () async {
      final reader = new GltfJsonReader(new File('test/ext/'
              'KHR_materials_pbrSpecularGlossiness/data/custom_property.gltf')
          .openRead());

      final context = new Context()
        ..path.add('materials')
        ..path.add('0')
        ..path.add('extensions')
        ..path.add('KHR_materials_pbrSpecularGlossiness')
        ..addIssue(SchemaError.unexpectedProperty, name: 'customProperty');

      await reader.read();

      expect(reader.context.errors, unorderedMatches(context.errors));
      expect(reader.context.warnings, unorderedMatches(context.warnings));
    });

    test('Valid', () async {
      final reader = new GltfJsonReader(new File('test/ext/'
              'KHR_materials_pbrSpecularGlossiness/data/valid_full.gltf')
          .openRead());

      final result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      expect(result.gltf.materials.toString(),
          '[{emissiveFactor: [0.0, 0.0, 0.0], alphaMode: OPAQUE, alphaCutoff: 0.5, doubleSided: false, extensions: {KHR_materials_pbrSpecularGlossiness: {diffuseFactor: [0.5, 0.5, 0.5, 0.5], diffuseTexture: {index: 0, texCoord: 0, extensions: {}}, specularFactor: [0.0, 0.0, 0.0], glossinessFactor: 0.5, specularGlossinessTexture: {index: 1, texCoord: 0, extensions: {}}, extensions: {}}}}]');
    });
  });
}

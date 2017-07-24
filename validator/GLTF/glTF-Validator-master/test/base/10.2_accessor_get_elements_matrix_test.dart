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

void main() {
  group('Accessor Matrix getElements', () {
    GltfReaderResult result;

    setUpAll(() async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/get_elements_matrix.gltf').openRead());

      result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      // All buffers are loaded
      expect(result.gltf.buffers.every((buffer) => buffer.data != null), true);
    });

    test('MAT2 BYTE', () async {
      final elements = result.gltf.accessors[0].getElements();

      expect(elements, orderedEquals(<int>[1, 2, -3, -4, 5, 6, -7, -8]));
    });

    test('MAT2 SHORT', () async {
      final elements = result.gltf.accessors[1].getElements();

      expect(elements, orderedEquals(<int>[-1, -2, 3, 4, -5, -6, 7, 8]));
    });

    test('MAT3 UBYTE', () async {
      final elements = result.gltf.accessors[2].getElements();

      expect(
          elements,
          orderedEquals(<int>[
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18
          ]));
    });

    test('MAT3 USHORT', () async {
      final elements = result.gltf.accessors[3].getElements();

      expect(
          elements,
          orderedEquals(<int>[
            3,
            2,
            1,
            6,
            5,
            4,
            9,
            8,
            7,
            12,
            11,
            10,
            15,
            14,
            13,
            18,
            17,
            16
          ]));
    });
  });
}

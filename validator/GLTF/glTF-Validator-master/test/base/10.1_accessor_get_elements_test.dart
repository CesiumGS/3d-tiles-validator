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
  group('Accessor getElements', () {
    GltfReaderResult result;

    setUpAll(() async {
      final reader = new GltfJsonReader(
          new File('test/base/data/accessor/get_elements.gltf').openRead());

      result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      // All buffers are loaded
      expect(result.gltf.buffers.every((buffer) => buffer.data != null), true);
    });

    test('Regular', () async {
      final elements = result.gltf.accessors[0].getElements();

      expect(
          elements, orderedEquals(<double>[0.0, -5.0, 27.0, -0.0, 10.5, 0.5]));
    });

    test('scalar float & vec2 ushort', () async {
      final elements1 = result.gltf.accessors[1].getElements();
      final elements2 = result.gltf.accessors[2].getElements();
      final elements2n = result.gltf.accessors[2].getElements(normalize: true);

      expect(elements1, orderedEquals(<double>[1000.0, 0.25]));
      expect(elements2, orderedEquals(<int>[50, 45, 12345, 0]));
      expect(
          elements2n,
          orderedEquals(<double>[
            50 * (1 / 65535),
            45 * (1 / 65535),
            12345 * (1 / 65535),
            0.0
          ]));
    });

    test('vec3 byte & vec4 short', () async {
      final elements1 = result.gltf.accessors[3].getElements();
      final elements1n = result.gltf.accessors[3].getElements(normalize: true);
      final elements2 = result.gltf.accessors[4].getElements();
      final elements2n = result.gltf.accessors[4].getElements(normalize: true);

      expect(elements1, orderedEquals(<int>[1, 126, -127, 0, 50, -125]));
      expect(
          elements1n,
          orderedEquals(<double>[
            1 / 127,
            126 * (1 / 127),
            -127 * (1 / 127),
            0.0,
            50 * (1 / 127),
            -125 * (1 / 127)
          ]));
      expect(
          elements2, orderedEquals(<int>[50, 45, 12345, 0, -1, 45, 12345, 0]));

      expect(
          elements2n,
          orderedEquals(<double>[
            50 * (1 / 32767),
            45 * (1 / 32767),
            12345 * (1 / 32767),
            0.0,
            -1 * (1 / 32767),
            45 * (1 / 32767),
            12345 * (1 / 32767),
            0 * (1 / 32767)
          ]));
    });
  });
}

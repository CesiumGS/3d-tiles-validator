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
          new File('test/base/data/accessor/get_elements_sparse.gltf').openRead());

      result = await reader.read();

      expect(reader.context.errors, isEmpty);
      expect(reader.context.warnings, isEmpty);

      // All buffers are loaded
      expect(result.gltf.buffers.every((buffer) => buffer.data != null), true);
    });

    test('Zeros', () async {
      final elements = result.gltf.accessors[0].getElements().toList();

      expect(elements, orderedEquals(<double>[0.0, 0.0]));
    });

    test('Zeros with Sparse', () async {
      final elements = result.gltf.accessors[1].getElements().toList();

      expect(elements, orderedEquals(<double>[0.125, 1024.0]));
    });

    test('Partially overridden', () async {
      final elements = result.gltf.accessors[2].getElements().toList();

      expect(elements, orderedEquals(<int>[70000, 100001, 54321, 200002]));
    });
  });
}

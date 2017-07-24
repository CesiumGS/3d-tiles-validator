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

import 'dart:async';
import 'dart:io';

import 'package:test/test.dart';
import 'package:gltf/gltf.dart';
import 'package:gltf/src/errors.dart';
import 'package:gltf/src/cmd_line.dart';

Future<ValidationResult> getValidationResult(String filename,
    [String ext = '.gltf']) async {
  final file = new File(filename);
  final context = new Context();
  final reader = new GltfReader(file.openRead(), context, ext);

  final readerResult = await reader.read();

  final validationResult =
      new ValidationResult(file.absolute.uri, reader.context, readerResult);

  final resourcesLoader =
      getFileResourceValidator(validationResult, readerResult);
  await resourcesLoader.load();

  return validationResult;
}

void main() {
  group('Load Images', () {
    test('File not found', () async {
      final validationResult =
          await getValidationResult('test/data_access/image/not_found.gltf');

      expect(validationResult.context.errors, hasLength(1));
      expect(validationResult.context.errors.first.type.code, 'FILE_NOT_FOUND');
    });

    test('Data URI & Invalid MIME', () async {
      final validationResult =
          await getValidationResult('test/data_access/image/data_uri.gltf');

      final context = new Context()
        ..path.add('images')
        ..path.add('0')
        ..addIssue(DataError.imageMimeTypeInvalid,
            args: ['image/png', 'image/jpeg']);

      expect(validationResult.context.errors, unorderedMatches(context.errors));
    });

    test('From BufferView', () async {
      final validationResult = await getValidationResult(
          'test/data_access/image/yellow.glb', '.glb');

      expect(validationResult.context.errors, isEmpty);

      final image = validationResult.readerResult.gltf.images.first;
      expect(image.info.mimeType, 'image/png');
      expect(image.info.height, 2);
      expect(image.info.width, 2);
      expect(image.info.bits, 8);
      expect(image.info.format, 6407);
    });

    test('External files', () async {
      final validationResult = await getValidationResult(
          'test/data_access/image/valid_external.gltf');

      expect(validationResult.context.errors, isEmpty);

      var image = validationResult.readerResult.gltf.images[0];
      expect(image.info.mimeType, 'image/png');
      expect(image.info.height, 1);
      expect(image.info.width, 1);
      expect(image.info.bits, 8);
      expect(image.info.format, 6407);

      image = validationResult.readerResult.gltf.images[1];
      expect(image.info.mimeType, 'image/jpeg');
      expect(image.info.height, 2);
      expect(image.info.width, 2);
      expect(image.info.bits, 8);
      expect(image.info.format, 6407);
    });

    test('Broken files', () async {
      final validationResult = await getValidationResult(
          'test/data_access/image/invalid_external.gltf');

      final context = new Context()
        ..path.add('images')
        ..addIssue(DataError.imageUnexpectedEos, index: 0)
        ..addIssue(DataError.imageUnrecognizedFormat, index: 1)
        ..addIssue(DataError.imageDataInvalid,
            index: 2, args: ['Invalid JPEG marker segment length.'])
        ..addIssue(DataError.imageNonPowerOfTwoDimensions,
            index: 3, args: [5, 3]);

      expect(validationResult.context.errors, unorderedMatches(context.errors));
      expect(validationResult.context.warnings,
          unorderedMatches(context.warnings));
    });
  });
}

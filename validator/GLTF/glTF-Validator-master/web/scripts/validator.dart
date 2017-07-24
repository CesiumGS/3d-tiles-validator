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
import 'dart:convert';
import 'dart:html';
import 'dart:js';
import 'dart:math';

import 'dart:typed_data';
import 'package:gltf/gltf.dart';
import 'package:path/path.dart' as path;

const int CHUNK_SIZE = 1024 * 1024;

final Element dropZone = querySelector('#dropZone');
final Element output = querySelector('#output');

void write(String text) {
  output.appendText('$text\n');
  context['Prism'].callMethod('highlightAll');
}

void main() {
  dropZone.onDragOver.listen((e) {
    dropZone.classes.add('hover');
    e.preventDefault();
  });

  dropZone.onDragLeave.listen((e) {
    dropZone.classes.remove('hover');
    e.preventDefault();
  });

  dropZone.onDrop.listen((e) {
    e.preventDefault();
    output.text = "";
    dropZone.classes
      ..remove('hover')
      ..add('drop');

    final reports = <ValidationResult>[];

    // Workaround for dart-sdk#26945
    final iterator = e.dataTransfer.files.iterator;

    void handleFile(File file) {
      final controller = new StreamController<List<int>>();
      final context = new Context();
      final ext = path.extension(file.name).toLowerCase();
      final reader = new GltfReader(controller.stream, context, ext);
      if (reader == null) {
        if (iterator.moveNext()) {
          handleFile(iterator.current);
        }
        return;
      }

      void checkNext() {
        if (iterator.moveNext())
          handleFile(iterator.current);
        else
          write(const JsonEncoder.withIndent('    ').convert(reports));
      }

      var index = 0;

      void handleNextChunk(File file) {
        final fileReader = new FileReader();
        fileReader.onLoadEnd.listen((event) {
          if (fileReader.result is Uint8List) {
            // ignore: argument_type_not_assignable
            controller.add(fileReader.result);
          }
          if (index < file.size)
            handleNextChunk(file);
          else
            controller.close();
        });
        final length = min(CHUNK_SIZE, file.size - index);
        fileReader.readAsArrayBuffer(file.slice(index, index += length));
      }

      handleNextChunk(file);

      reader.read().then((readerResult) {
        final validationResult =
            new ValidationResult(Uri.parse(file.name), context, readerResult);

        if (readerResult?.gltf != null) {
          final resourcesLoader =
              new ResourcesLoader(validationResult, readerResult.gltf,
                  externalBytesFetch: (uri) {
                    if (uri != null) {
                      return null;
                    } else {
                      return readerResult.buffer;
                    }
                  },
                  externalStreamFetch: (uri) => null);

          resourcesLoader.load().then((_) {
            reports.add(validationResult);
            checkNext();
          }, onError: () {
            reports.add(validationResult);
            checkNext();
          });
        } else {
          reports.add(validationResult);
          checkNext();
        }
      });
    }

    if (iterator.moveNext()) {
      handleFile(iterator.current);
    }
    dropZone.classes.remove('drop');
  });
}

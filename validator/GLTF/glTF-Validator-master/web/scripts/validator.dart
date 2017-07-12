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

import 'dart:async';
import 'dart:convert';
import 'dart:html';
import 'dart:js';
import 'dart:math';

import 'package:gltf/gltf.dart';

const int CHUNK_SIZE = 1024 * 1024;

final dropZone = querySelector('#dropZone');
final output = querySelector('#output');

void write(String text) {
  output.appendText("$text\n");
  context["Prism"].callMethod("highlightAll");
}

void main() {
  dropZone.onDragOver.listen((MouseEvent e) {
    dropZone.classes.add('hover');
    e.preventDefault();
  });

  dropZone.onDragLeave.listen((MouseEvent e) {
    dropZone.classes.remove('hover');
    e.preventDefault();
  });

  dropZone.onDrop.listen((MouseEvent e) {
    e.preventDefault();
    output.text = "";
    dropZone.classes.remove('hover');
    dropZone.classes.add('drop');

    final reports = <Report>[];

    // Workaround for dart-sdk#26945
    final iterator = e.dataTransfer.files.iterator;

    void handleFile(File file) {
      final controller = new StreamController<List<int>>();
      GltfReader reader;
      Report report;
      if (file.name.endsWith(".glb")) {
        reader = new GlbReader(controller.stream);
        report = new Report(reader.context, file.name);
      } else if (file.name.endsWith(".gltf")) {
        reader = new GltfReader(controller.stream);
        report = new Report(reader.context, file.name);
      } else {
        if (iterator.moveNext()) handleFile(iterator.current);
        return;
      }

      void checkNext() {
        if (iterator.moveNext())
          handleFile(iterator.current);
        else
          write(new JsonEncoder.withIndent("    ").convert(reports));
      }

      int index = 0;

      void handleNextChunk(File file) {
        final fileReader = new FileReader();
        fileReader.onLoadEnd.listen((ProgressEvent event) {
          controller.add(fileReader.result as dynamic/*=List<int>*/);
          if (index < file.size)
            handleNextChunk(file);
          else
            controller.close();
        });
        final length = min(CHUNK_SIZE, file.size - index);
        fileReader.readAsArrayBuffer(file.slice(index, index += length));
      }

      handleNextChunk(file);

      Future.wait([reader.root, reader.done]).then((futures) {
        final root = futures[0] as dynamic/*=Gltf*/;
        report.info = root?.info;
        reports.add(report);
        checkNext();
      }, onError: (e) {
        checkNext();
      });
    }

    if (iterator.moveNext()) handleFile(iterator.current);
    dropZone.classes.remove('drop');
  });
}

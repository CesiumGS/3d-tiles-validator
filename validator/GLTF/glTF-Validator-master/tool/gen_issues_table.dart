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

import 'dart:io';
import 'package:gltf/src/errors.dart';

void main() {
  final file = new File("ISSUES.md");
  final sb = new StringBuffer();

  sb
    ..writeln("# glTF 1.0.1 Validation Issues")
    ..writeln("## Errors")
    ..writeln("| No | Name | Message |")
    ..writeln("|:-:|------------|-------------|");

  final args = ["%1", "%2", "%3"];
  int i = 1;
  GltfError.messages.forEach((name, message) {
    sb.writeln("| $i. | $name | ${message(args)} |");
    i++;
  });
  sb.writeln("");

  sb
    ..writeln("## Warnings")
    ..writeln("| No | Name | Message |")
    ..writeln("|:-:|------------|-------------|");

  i = 1;
  GltfWarning.messages.forEach((name, message) {
    sb.writeln("| $i. | $name | ${message(args)} |");
    i++;
  });

  file.writeAsStringSync(sb.toString(), flush: true);
}

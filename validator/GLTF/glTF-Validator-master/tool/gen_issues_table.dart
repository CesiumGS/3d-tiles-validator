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
import 'dart:mirrors';
import 'package:gltf/src/errors.dart';

void main() {
  final sb = new StringBuffer('# glTF 2.0 Validation Issues\n');

  var total = 0;
  void processErrorClass(Type type) {
    final errorClassMirror = reflectClass(type);
    sb
      ..writeln('## ${errorClassMirror.reflectedType}')
      ..writeln('| No | Name | Message |')
      ..writeln('|:---:|------------|-------------|');

    var i = 0;
    final args = ['%1', '%2', '%3', '%4'];
    for (final symbol in errorClassMirror.staticMembers.keys) {
      final Object issueType = errorClassMirror.getField(symbol).reflectee;
      if (issueType is IssueType) {
        sb.writeln('|${++i}|${issueType.code}|${issueType.message(args)}|');
      }
    }
    total += i;
  }

  processErrorClass(IoError);
  processErrorClass(SchemaError);
  processErrorClass(SemanticError);
  processErrorClass(LinkError);
  processErrorClass(DataError);
  processErrorClass(GlbError);

  new File('ISSUES.md').writeAsStringSync(sb.toString(), flush: true);
  print('Total number of issues: $total');
}

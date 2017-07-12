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
library gltf.validation_report;

import 'dart:convert';

import 'context.dart';

class Report {
  final Context context;
  final String resource;
  final List<Map<String, String>> errors = <Map<String, String>>[];
  final List<Map<String, String>> warnings = <Map<String, String>>[];
  Map<String, Object> info;

  String get result {
    if (errors.isNotEmpty) return "ERROR";
    if (warnings.isNotEmpty) return "WARNING";
    return "OK";
  }

  Report(this.context, this.resource, {this.info: const <String, Object>{}});

  String toJsonString({bool indented: true}) {
    final encoder =
        indented ? new JsonEncoder.withIndent("    ") : new JsonEncoder();

    return encoder.convert(toJson());
  }

  Map<String, Object> toJson() {
    final reportMap = <String, Object>{};

    reportMap["resource"] = resource;
    reportMap["mimeType"] = context.mimeType;

    for (final error in context.errors) errors.add(error.toMap());
    for (final warning in context.warnings) warnings.add(warning.toMap());

    reportMap["result"] = result;

    if (errors.isNotEmpty) reportMap["errors"] = errors;
    if (warnings.isNotEmpty) reportMap["warnings"] = warnings;
    if (info?.isNotEmpty ?? false) reportMap["info"] = info;

    return reportMap;
  }
}

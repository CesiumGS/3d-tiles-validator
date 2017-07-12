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

library gltf.utils;

import 'gl.dart' as gl;
import 'base/gltf_property.dart';
import 'ext/extensions.dart';

String getId(Map<String, Object> map, String name, Context context,
    {bool req: true}) {
  final value = map[name];
  if (value is String) {
    if (value.isNotEmpty) return value;
    context.addIssue(GltfError.EMPTY_ID, name: name);
  } else if (value == null) {
    if (req) context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context
        .addIssue(GltfError.TYPE_MISMATCH, name: name, args: [value, "string"]);
  }
  return null;
}

bool getBool(Map<String, Object> map, String name, Context context,
    {bool req: false, bool def}) {
  final value = map[name];
  if (value is bool) return value;
  if (value == null) {
    if (!req) return def;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "boolean"]);
    return def;
  }
  return null;
}

int getInt(Map<String, Object> map, String name, Context context,
    {bool req: false, int min, int max, int def, Iterable<int> list}) {
  final value = map[name];
  if (value is int) {
    if (list != null) {
      if (!checkEnum(name, value, list, context)) return null;
    } else if ((min != null && value < min) || (max != null && value > max)) {
      context.addIssue(GltfError.VALUE_OUT_OF_RANGE, name: name, args: [value]);
      return null;
    }
    return value;
  } else if (value == null) {
    if (!req) return def;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "integer"]);
  }
  return null;
}

num getNum(Map<String, Object> map, String name, Context context,
    {bool req: false,
    num min,
    num exclMin,
    num max,
    num def,
    Iterable<num> list}) {
  final value = map[name];
  if (value is num) {
    if (list != null) {
      if (!checkEnum(name, value, list, context)) return null;
    } else if ((min != null && value < min) ||
        (exclMin != null && value <= exclMin) ||
        (max != null && value > max)) {
      context.addIssue(GltfError.VALUE_OUT_OF_RANGE, name: name, args: [value]);
      return null;
    }
    return value;
  } else if (value == null) {
    if (!req) return def;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context
        .addIssue(GltfError.TYPE_MISMATCH, name: name, args: [value, "number"]);
  }
  return null;
}

String getString(Map<String, Object> map, String name, Context context,
    {bool req: false, Iterable<String> list, String def, RegExp regexp}) {
  final value = map[name];
  if (value is String) {
    if (list != null) {
      if (!checkEnum(name, value, list, context)) return null;
    } else if (regexp?.hasMatch(value) == false) {
      context.addIssue(GltfError.PATTERN_MISMATCH,
          name: name, args: [value, regexp.pattern]);
      return null;
    }
    return value;
  } else if (value == null) {
    if (!req) return def;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context
        .addIssue(GltfError.TYPE_MISMATCH, name: name, args: [value, "string"]);
  }
  return null;
}

Map<String, Object> getMap(
    Map<String, Object> map, String name, Context context,
    {bool req: false}) {
  final value = map[name];
  if (value is Map) {
    // JSON mandates all keys to be string
    return value as dynamic/*=Map<String, Object>*/;
  } else if (value == null) {
    if (req) {
      context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
      return null;
    }
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "JSON object"]);
    if (req) return null;
  }
  return <String, dynamic>{};
}

Map<String, String> getStringMap(
    Map<String, Object> map, String name, Context context,
    {bool req: false}) {
  final value = map[name];
  if (value is Map/*=Map<String, Object>*/) {
    // JSON mandates all keys to be string
    if (context.validate) {
      var wrongMemberFound = false;
      context.path.add(name);
      value.forEach((k, v) {
        if (v is! String) {
          context
              .addIssue(GltfError.TYPE_MISMATCH, name: k, args: [v, "string"]);
          wrongMemberFound = true;
        }
      });
      context.path.removeLast();
      if (wrongMemberFound) <String, String>{};
    }
    return value as dynamic/*=Map<String, String>*/;
  } else if (value == null) {
    if (req) {
      context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
      return null;
    }
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "JSON object"]);
    if (req) return null;
  }
  return <String, String>{};
}

Uri parseUri(String uri, Context context) {
  try {
    return Uri.parse(uri);
  } on FormatException catch (e) {
    context.addIssue(GltfError.INVALID_URI, name: URI, args: [uri, e]);
    return null;
  }
}

List<bool> getBoolList(Map<String, Object> map, String name, Context context,
    {bool req: false, List<bool> def, List<int> lengthsList}) {
  final value = map[name];
  if (value is List/*=List<Object>*/) {
    if ((lengthsList != null) &&
        !checkEnum(name, value.length, lengthsList, context, true)) return null;
    var wrongMemberFound = false;
    for (final v in value) {
      if (v is! bool) {
        context.addIssue(GltfError.ARRAY_TYPE_MISMATCH,
            name: name, args: [v, "boolean"]);
        wrongMemberFound = true;
      }
    }
    if (wrongMemberFound) return null;
    return value as dynamic/*=List<bool>*/;
  } else if (value == null) {
    if (!req) return def;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "boolean[]"]);
  }
  return null;
}

List<num> getNumList(Map<String, Object> map, String name, Context context,
    {bool req: false,
    num min,
    num max,
    num exclMin,
    int minItems,
    int maxItems,
    List<num> def,
    List<num> list,
    Iterable<int> lengthsList}) {
  final value = map[name];
  if (value is List/*=List<Object>*/) {
    if (lengthsList != null) {
      if (!checkEnum(name, value.length, lengthsList, context, true))
        return null;
    } else if ((minItems != null && value.length < minItems) ||
        (maxItems != null && value.length > maxItems)) {
      context.addIssue(GltfError.ARRAY_LENGTH_OUT_OF_RANGE,
          name: name, args: [value.length]);
      return null;
    }
    var wrongMemberFound = false;
    for (final v in value) {
      if (v is num) {
        if (list != null) {
          if (!checkEnum(name, v, list, context)) wrongMemberFound = true;
        } else if ((min != null && v < min) ||
            (exclMin != null && v <= exclMin) ||
            (max != null && v > max)) {
          context.addIssue(GltfError.VALUE_OUT_OF_RANGE, name: name, args: [v]);
          wrongMemberFound = true;
        }
      } else {
        context.addIssue(GltfError.ARRAY_TYPE_MISMATCH,
            name: name, args: [v, "number"]);
        wrongMemberFound = true;
      }
    }
    if (wrongMemberFound) return null;
    return value as dynamic/*=List<num>*/;
  } else if (value == null) {
    if (!req) return def;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "number[]"]);
  }
  return null;
}

List<int> getGlIntList(Map<String, Object> map, String name, Context context,
    {bool req: false, int type, int length}) {
  final value = map[name];
  if (value is List/*=List<Object>*/) {
    if (value.length != length) {
      context.addIssue(GltfError.ARRAY_LENGTH_NOT_IN_LIST,
          name: name, args: [value, length]);
    }
    var wrongMemberFound = false;
    for (final v in value) {
      if (v is int) {
        if (type != null) {
          final min = gl.TYPE_MINS[type];
          final max = gl.TYPE_MAXS[type];
          if ((v < min) || (v > max)) {
            context.addIssue(GltfError.INVALID_GL_VALUE,
                name: name, args: [v, gl.TYPE_NAMES[type]]);
            wrongMemberFound = true;
          }
        }
      } else {
        context.addIssue(GltfError.ARRAY_TYPE_MISMATCH,
            name: name, args: [v, "integer"]);
        wrongMemberFound = true;
      }
    }
    if (wrongMemberFound) return null;
    return value as dynamic/*=List<int>*/;
  } else if (value == null) {
    if (!req) return null;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "number[]"]);
  }
  return null;
}

List<String> getStringList(
    Map<String, Object> map, String name, Context context,
    {bool req: false,
    int minItems,
    int maxItems,
    List<String> def,
    List<String> list,
    Iterable<int> lengthsList}) {
  final value = map[name];
  if (value is List/*=List<Object>*/) {
    if (lengthsList != null) {
      if (!checkEnum(name, value.length, lengthsList, context, true))
        return null;
    } else if ((minItems != null && value.length < minItems) ||
        (maxItems != null && value.length > maxItems)) {
      context.addIssue(GltfError.ARRAY_LENGTH_OUT_OF_RANGE,
          name: name, args: [value.length]);
      return null;
    }
    var wrongMemberFound = false;
    for (final v in value) {
      if (v is! String) {
        context.addIssue(GltfError.ARRAY_TYPE_MISMATCH,
            name: name, args: [v, "string"]);
        wrongMemberFound = true;
        continue;
      }
      if (list != null && !checkEnum(name, v, list, context))
        wrongMemberFound = true;
    }
    if (wrongMemberFound) return null;
    return value as dynamic/*=List<String>*/;
  } else if (value == null) {
    if (!req) return def;
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "string[]"]);
  }
  return null;
}

List<Map<String, Object>> getMapList(
    Map<String, Object> map, String name, Context context,
    {bool req: false, int minItems: 0}) {
  final value = map[name];
  if (value is List/*=List<Object>*/) {
    if (value.length < minItems)
      context.addIssue(GltfError.ARRAY_LENGTH_OUT_OF_RANGE,
          name: name, args: [value.length]);
    var wrongMemberFound = false;
    for (final v in value) {
      if (v is! Map) {
        context.addIssue(GltfError.ARRAY_TYPE_MISMATCH,
            name: name, args: [v, "JSON object"]);
        wrongMemberFound = true;
      }
    }
    if (wrongMemberFound) return null;
    return value as dynamic/*=List<Map<String, Object>>*/;
  } else if (value == null) {
    if (!req) return <Map<String, Object>>[];
    context.addIssue(GltfError.UNDEFINED_PROPERTY, name: name);
  } else {
    context.addIssue(GltfError.TYPE_MISMATCH,
        name: name, args: [value, "JSON object[]"]);
  }
  return null;
}

String getName(Map<String, Object> map, Context context) =>
    getString(map, NAME, context);

Map<String, Object> getExtensions(
    Map<String, Object> map, Type type, Context context) {
  final extensions = <String, Object>{};
  final extensionMaps = getMap(map, EXTENSIONS, context);

  if (extensionMaps.isEmpty) return extensions;

  context.path.add(EXTENSIONS);
  for (final extension in extensionMaps.keys) {
    if (!context.extensionsLoaded.contains(extension)) {
      if (context.validate) {
        if (context.extensionsUsed.contains(extension)) {
          context
              .addIssue(GltfWarning.UNSUPPORTED_EXTENSION, args: [extension]);
        } else {
          context.addIssue(GltfError.UNDECLARED_EXTENSION, name: extension);
        }
      }
      continue;
    }

    final functions =
        context.extensionsFunctions[new ExtensionTuple(type, extension)];

    if (functions == null) {
      context.addIssue(GltfError.UNEXPECTED_EXTENSION, name: extension);
      continue;
    }

    final extensionMap = getMap(extensionMaps, extension, context, req: true);
    if (extensionMap != null) {
      context.path.add(extension);
      extensions[extension] = functions.fromMap(extensionMap, context);
      context.path.removeLast();
    }
  }
  context.path.removeLast();

  return extensions;
}

Object getExtras(Map<String, Object> map) => map[EXTRAS];

bool checkEnum(String name, Object value, Iterable list, Context context,
    [bool isLengthList = false]) {
  if (!list.contains(value)) {
    context.addIssue(
        isLengthList
            ? GltfError.ARRAY_LENGTH_NOT_IN_LIST
            : GltfError.VALUE_NOT_IN_LIST,
        name: name,
        args: [value, list]);

    return false;
  }
  return true;
}

void checkMembers(
    Map<String, Object> map, List<String> knownMembers, Context context,
    [bool useSuper = true]) {
  const superMembers = const <String>[EXTENSIONS, EXTRAS];
  for (final k in map.keys) {
    if (!knownMembers.contains(k) && !(useSuper && superMembers.contains(k)))
      context.addIssue(GltfWarning.UNEXPECTED_PROPERTY, name: k);
  }
}

void checkDuplicates(List elements, String name, Context context) {
  if (elements.length > 1) {
    final set = new Set<Object>.from(elements);
    if (set.length != elements.length)
      context.addIssue(GltfWarning.DUPLICATE_ELEMENTS, name: name);
  }
}

void removeDuplicates(List<String> list, Context context, String name) {
  final set = new Set<String>.from(list);
  if (set.length != list.length) {
    context.addIssue(GltfWarning.DUPLICATE_ELEMENTS, name: name);
    list
      ..clear()
      ..addAll(set);
  }
}

typedef void _NodeHandlerFunction(Node element, String id);

void resolveList/*<T>*/(List<String> sourceList, List/*<T>*/ targetList,
    Map<String, Object/*=T*/ > map, String name, Context context,
    [_NodeHandlerFunction handleNode]) {
  if (sourceList != null) {
    for (final id in sourceList) {
      final element = map[id];
      if (element != null) {
        targetList.add(element);
        if (handleNode != null)
          handleNode((element as dynamic/*=Node*/), id);
      } else {
        context
            .addIssue(GltfError.UNRESOLVED_REFERENCE, name: name, args: [id]);
      }
    }
  }
}

String mapToString([Map/*=Map<String, Object>*/ map]) {
  return new Map<String, Object>.fromIterable(
      map.keys.where((key) => key != null && map[key] != null),
      key: (String key) => key,
      value: (String key) => map[key]).toString();
}

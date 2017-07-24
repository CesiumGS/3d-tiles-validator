/*
 * # Copyright (c) 2016-2017 The Khronos Group Inc.
 * # Copyright (c) 2016 Alexey Knyazev
 * #
 * # Licensed under the Apache License, Version 2.0 (the 'License');
 * # you may not use this file except in compliance with the License.
 * # You may obtain a copy of the License at
 * #
 * #     http://www.apache.org/licenses/LICENSE-2.0
 * #
 * # Unless required by applicable law or agreed to in writing, software
 * # distributed under the License is distributed on an 'AS IS' BASIS,
 * # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * # See the License for the specific language governing permissions and
 * # limitations under the License.
 */

library gltf.utils;

import 'dart:collection';
import 'dart:typed_data';

import 'package:vector_math/vector_math.dart';

import 'base/gltf_property.dart';
import 'ext/extensions.dart';
import 'gl.dart' as gl;

int getIndex(Map<String, Object> map, String name, Context context,
    {bool req: true}) {
  final value = map[name];
  if (value is int) {
    if (value >= 0) {
      return value;
    }
    context.addIssue(SchemaError.invalidIndex, name: name);
  } else if (value == null) {
    if (req) {
      context.addIssue(SchemaError.undefinedProperty, name: name);
    }
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'integer']);
  }
  return -1;
}

bool getBool(Map<String, Object> map, String name, Context context) {
  final value = map[name];
  if (value == null) {
    return false;
  }
  if (value is bool) {
    return value;
  }
  context
      .addIssue(SchemaError.typeMismatch, name: name, args: [value, 'boolean']);
  return false;
}

int getUint(Map<String, Object> map, String name, Context context,
    {bool req: false, int min, int max, int def: -1, Iterable<int> list}) {
  final value = map[name];
  if (value is int) {
    if (list != null) {
      if (!checkEnum<int>(name, value, list, context)) {
        return -1;
      }
    } else if ((min != null && value < min) || (max != null && value > max)) {
      context.addIssue(SchemaError.valueNotInRange, name: name, args: [value]);
      return -1;
    }
    return value;
  } else if (value == null) {
    if (!req) {
      return def;
    }
    context.addIssue(SchemaError.undefinedProperty, name: name);
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'integer']);
  }
  return -1;
}

double getFloat(Map<String, Object> map, String name, Context context,
    {bool req: false,
    double min,
    double exclMin,
    double max,
    double def: double.NAN,
    Iterable<double> list}) {
  final value = map[name];
  if (value is num) {
    if (list != null) {
      if (!checkEnum<num>(name, value, list, context)) {
        return double.NAN;
      }
    } else if ((min != null && value < min) ||
        (exclMin != null && value <= exclMin) ||
        (max != null && value > max)) {
      context.addIssue(SchemaError.valueNotInRange, name: name, args: [value]);
      return double.NAN;
    }
    return value.toDouble();
  } else if (value == null) {
    if (!req) {
      return def;
    }
    context.addIssue(SchemaError.undefinedProperty, name: name);
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'number']);
  }
  return double.NAN;
}

String getString(Map<String, Object> map, String name, Context context,
    {bool req: false, Iterable<String> list, String def, RegExp regexp}) {
  final value = map[name];
  if (value is String) {
    if (list != null) {
      if (!checkEnum<String>(name, value, list, context)) {
        return null;
      }
    } else if (regexp?.hasMatch(value) == false) {
      context.addIssue(SchemaError.patternMismatch,
          name: name, args: [value, regexp.pattern]);
      return null;
    }
    return value;
  } else if (value == null) {
    if (!req) {
      return def;
    }
    context.addIssue(SchemaError.undefinedProperty, name: name);
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'string']);
  }
  return null;
}

Uri getUri(String uriString, Context context) {
  try {
    final uri = Uri.parse(uriString);
    if (uri.hasAbsolutePath || uri.hasScheme) {
      context
          .addIssue(SemanticError.nonRelativeUri, name: URI, args: [uriString]);
    }
    return uri;
  } on FormatException catch (e) {
    context.addIssue(SchemaError.invalidUri, name: URI, args: [uriString, e]);
    return null;
  }
}

Map<String, Object> getMap(
    Map<String, Object> map, String name, Context context,
    {bool req: false}) {
  final value = map[name];
  if (value is Map<String, Object>) {
    // JSON mandates all keys to be string
    return value;
  } else if (value == null) {
    if (req) {
      context.addIssue(SchemaError.undefinedProperty, name: name);
      return null;
    }
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'JSON object']);
    if (req) {
      return null;
    }
  }
  return <String, Object>{};
}

T getObjectFromInnerMap<T>(Map<String, Object> map, String name,
    Context context, FromMapFunction<T> fromMap,
    {bool req: false}) {
  final value = map[name];
  if (value is Map<String, Object>) {
    // JSON mandates all keys to be string
    context.path.add(name);
    final object = fromMap(value, context);
    context.path.removeLast();
    return object;
  } else if (value == null) {
    if (req) {
      context.addIssue(SchemaError.undefinedProperty, name: name);
    }
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'JSON object']);
  }
  return null;
}

List<int> getIndicesList(Map<String, Object> map, String name, Context context,
    {bool req: false}) {
  final value = map[name];
  if (value is List<Object>) {
    if (context.validate) {
      if (value.isEmpty) {
        context.addIssue(SchemaError.emptyEntity, name: name);
        return null;
      }
      context.path.add(name);
      final uniqueItems = new Set<int>();
      for (var i = 0; i < value.length; i++) {
        final v = value[i];
        if (v is int) {
          if (v < 0) {
            context.addIssue(SchemaError.invalidIndex, index: i);
          } else if (!uniqueItems.add(v)) {
            context.addIssue(SchemaError.arrayDuplicateElements, args: [i]);
          }
        } else {
          value[i] = -1;
          context.addIssue(SchemaError.typeMismatch,
              index: i, args: [v, 'integer']);
        }
      }
      context.path.removeLast();
      return uniqueItems.toList(growable: false);
    }
    return value; // ignore: return_of_invalid_type
  } else if (value == null) {
    if (req) {
      context.addIssue(SchemaError.undefinedProperty, name: name);
    }
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'JSON array']);
  }
  return null;
}

Map<String, int> getIndicesMap(Map<String, Object> map, String name,
    Context context, _CheckKeyFunction checkKey) {
  final value = map[name];
  if (value is Map<String, Object>) {
    if (value.isEmpty) {
      context.addIssue(SchemaError.emptyEntity, name: name);
      return null;
    }
    context.path.add(name);
    value.forEach((k, v) {
      checkKey(k);
      if (v is int) {
        if (v < 0) {
          context.addIssue(SchemaError.invalidIndex, name: k);
          // Sanitize value
          value[k] = -1;
        }
      } else {
        // Sanitize value
        value[k] = -1;
        context
            .addIssue(SchemaError.typeMismatch, name: k, args: [v, 'integer']);
      }
    });
    context.path.removeLast();

    return value; // ignore: return_of_invalid_type
  } else if (value == null) {
    context.addIssue(SchemaError.undefinedProperty, name: name);
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'JSON object']);
  }
  return null;
}

List<Map<String, int>> getIndicesMapsList(Map<String, Object> map, String name,
    Context context, _CheckKeyFunction checkKey) {
  final list = map[name];
  if (list is List<Object>) {
    if (context.validate) {
      if (list.isEmpty) {
        context.addIssue(SchemaError.emptyEntity, name: name);
        return null;
      } else {
        var invalidElementFound = false;
        context.path.add(name);
        for (var i = 0; i < list.length; i++) {
          final innerMap = list[i];
          // JSON mandates all keys to be string
          if (innerMap is Map<String, Object>) {
            if (innerMap.isEmpty) {
              context.addIssue(SchemaError.emptyEntity, index: i);
              invalidElementFound = true;
            } else {
              context.path.add(i.toString());
              innerMap.forEach((k, v) {
                checkKey(k);
                if (v is int) {
                  if (v < 0) {
                    context.addIssue(SchemaError.invalidIndex, name: k);
                    // Sanitize value
                    innerMap[k] = -1;
                  }
                } else {
                  context.addIssue(SchemaError.typeMismatch,
                      name: k, args: [v, 'integer']);
                  // Sanitize value
                  innerMap[k] = -1;
                }
              });
              context.path.removeLast();
            }
          } else {
            context.addIssue(SchemaError.arrayTypeMismatch,
                args: [innerMap, 'JSON object']);
            invalidElementFound = true;
          }
        }
        context.path.removeLast();
        if (invalidElementFound) {
          return null;
        }
      }
    }
    return list; // ignore: return_of_invalid_type
  } else if (list != null) {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [list, 'JSON array']);
  }
  return null;
}

List<double> getFloatList(Map<String, Object> map, String name, Context context,
    {bool req: false,
    bool singlePrecision: false,
    double min,
    double max,
    List<double> def,
    List<int> lengthsList}) {
  final value = map[name];
  if (value is List) {
    if (lengthsList != null) {
      if (!checkEnum<int>(name, value.length, lengthsList, context,
          isLengthList: true)) {
        return null;
      }
    } else if (value.isEmpty) {
      context.addIssue(SchemaError.emptyEntity, name: name);
      return null;
    }
    if (context.validate) {
      var wrongMemberFound = false;
      for (final v in value) {
        if (v is num) {
          if ((min != null && v < min) || (max != null && v > max)) {
            context
                .addIssue(SchemaError.valueNotInRange, name: name, args: [v]);
            wrongMemberFound = true;
          }
        } else {
          context.addIssue(SchemaError.arrayTypeMismatch,
              name: name, args: [v, 'number']);
          wrongMemberFound = true;
        }
      }
      if (wrongMemberFound) {
        return null;
      }
    }
    if (singlePrecision) {
      return value
          .map<double>((num v) => doubleToSingle(v.toDouble()))
          .toList(growable: false);
    } else {
      return value.map<double>((num v) => v.toDouble()).toList(growable: false);
    }
  } else if (value == null) {
    if (!req) {
      return def;
    }
    context.addIssue(SchemaError.undefinedProperty, name: name);
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'number[]']);
  }
  return null;
}

List<num> getGlIntList(Map<String, Object> map, String name, Context context,
    int type, int length) {
  final value = map[name];
  if (value is List) {
    if (value.length != length) {
      context.addIssue(SchemaError.arrayLengthNotInList,
          name: name, args: [value, length]);
    }
    var wrongMemberFound = false;
    for (final v in value) {
      if (v is num && v.round() == v) {
        if (v is! int) {
          context.addIssue(SemanticError.integerWrittenAsFloat,
              name: name, args: [v]);
        }
        if (type != -1) {
          final min = gl.TYPE_MINS[type];
          final max = gl.TYPE_MAXS[type];
          if ((v < min) || (v > max)) {
            context.addIssue(SemanticError.invalidGlValue,
                name: name, args: [v, gl.TYPE_NAMES[type]]);
            wrongMemberFound = true;
          }
        }
      } else {
        context.addIssue(SchemaError.arrayTypeMismatch,
            name: name, args: [v, 'integer']);
        wrongMemberFound = true;
      }
    }
    if (wrongMemberFound) {
      return null;
    }
    return value; // ignore: return_of_invalid_type
  } else if (value != null) {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'number[]']);
  }
  return null;
}

List<String> getStringList(
    Map<String, Object> map, String name, Context context) {
  final value = map[name];
  if (value is List<Object>) {
    if (value.isEmpty) {
      context.addIssue(SchemaError.emptyEntity, name: name);
      return <String>[];
    }
    if (context.validate) {
      var wrongMemberFound = false;
      context.path.add(name);
      final uniqueItems = new Set<String>();
      for (var i = 0; i < value.length; i++) {
        final v = value[i];
        if (v is String) {
          if (!uniqueItems.add(v)) {
            context.addIssue(SchemaError.arrayDuplicateElements, args: [i]);
          }
        } else {
          context.addIssue(SchemaError.arrayTypeMismatch,
              index: i, args: [v, 'string']);
          wrongMemberFound = true;
        }
      }
      context.path.removeLast();
      if (wrongMemberFound) {
        return <String>[];
      } else {
        return uniqueItems.toList(growable: false);
      }
    }
    return value; // ignore: return_of_invalid_type
  } else if (value != null) {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'string[]']);
  }
  return <String>[];
}

List<Map<String, Object>> getMapList(
    Map<String, Object> map, String name, Context context) {
  final value = map[name];
  if (value is List<Object>) {
    if (value.isEmpty) {
      context.addIssue(SchemaError.emptyEntity, name: name);
      return null;
    } else {
      var invalidElementFound = false;
      for (final v in value) {
        if (v is! Map) {
          context.addIssue(SchemaError.arrayTypeMismatch,
              name: name, args: [v, 'JSON object']);
          invalidElementFound = true;
        }
      }
      if (invalidElementFound) {
        return null;
      }
    }
    return value; // ignore: return_of_invalid_type
  } else if (value == null) {
    context.addIssue(SchemaError.undefinedProperty, name: name);
  } else {
    context.addIssue(SchemaError.typeMismatch,
        name: name, args: [value, 'JSON array']);
  }
  return null;
}

String getName(Map<String, Object> map, Context context) =>
    getString(map, NAME, context);

Map<String, Object> getExtensions(
    Map<String, Object> map, Type type, Context context) {
  final extensions = <String, Object>{};
  final extensionMaps = getMap(map, EXTENSIONS, context);

  if (extensionMaps.isEmpty) {
    return extensions;
  }

  context.path.add(EXTENSIONS);
  for (final extension in extensionMaps.keys) {
    if (!context.extensionsLoaded.contains(extension)) {
      extensions[extension] = null;
      if (context.validate && !context.extensionsUsed.contains(extension)) {
        context.addIssue(LinkError.undeclaredExtension, name: extension);
      }
      continue;
    }

    final functions =
        context.extensionsFunctions[new ExtensionTuple(type, extension)];

    if (functions == null) {
      context.addIssue(LinkError.unexpectedExtensionObject, name: extension);
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

bool checkEnum<T>(String name, T value, Iterable<T> list, Context context,
    {bool isLengthList: false}) {
  if (!list.contains(value)) {
    context.addIssue(
        isLengthList
            ? SchemaError.arrayLengthNotInList
            : SchemaError.valueNotInList,
        name: name,
        args: [value, list]);

    return false;
  }
  return true;
}

void checkMembers(
    Map<String, Object> map, List<String> knownMembers, Context context,
    {bool useSuper = true}) {
  const superMembers = const <String>[EXTENSIONS, EXTRAS];
  for (final k in map.keys) {
    if (!knownMembers.contains(k) && !(useSuper && superMembers.contains(k)))
      context.addIssue(SchemaError.unexpectedProperty, name: k);
  }
}

typedef void _NodeHandlerFunction(Node element, int nodeIndex, int index);

typedef void _CheckKeyFunction(String key);

void resolveNodeList(List<int> sourceList, List<Node> targetList,
    SafeList<Node> nodes, String name, Context context,
    [_NodeHandlerFunction handleNode]) {
  if (sourceList != null) {
    context.path.add(name);
    for (var i = 0; i < sourceList.length; i++) {
      final nodeIndex = sourceList[i];
      if (nodeIndex == null) {
        continue;
      }
      final node = nodes[nodeIndex];
      if (node != null) {
        targetList[i] = node;
        if (handleNode != null) {
          handleNode(node, nodeIndex, i);
        }
      } else {
        context.addIssue(LinkError.unresolvedReference,
            index: i, args: [nodeIndex]);
      }
    }
    context.path.removeLast();
  }
}

String mapToString([Map<String, Object> map]) =>
    new Map<String, Object>.fromIterable(
        map.keys.where((key) => key != null && map[key] != null),
        key: (String key) => key,
        value: (String key) => map[key]).toString();

class SafeList<T> extends ListBase<T> {
  List<T> _list;
  final int _length;

  SafeList(this._length) {
    _list = new List<T>(length);
  }

  SafeList.empty() : _length = 0 {
    _list = new List<T>(0);
  }

  @override
  T operator [](int index) =>
      (index == null || index < 0 || index >= _list.length)
          ? null
          : _list[index];

  @override
  void operator []=(int index, T value) {
    assert(value != null);
    assert(index >= 0 && index < length);
    _list[index] = value;
  }

  @override
  int get length => _length;

  @override
  set length(int newLength) {
    throw new UnsupportedError('Changing length is not supported');
  }

  @override
  String toString() => _list.toString();

  void forEachWithIndices(void action(int index, T element)) {
    for (var i = 0; i < _length; i++) {
      action(i, _list[i]);
    }
  }
}

final _float = new Float32List(1);
double doubleToSingle(num value) {
  _float[0] = value.toDouble();
  return _float[0];
}

final _matrix = new Matrix4.zero();
final _translation = new Vector3.zero();
final _rotation = new Quaternion.identity();
final _scale = new Vector3.zero();
bool isTrsDecomposable(Matrix4 matrix) {
  if (matrix[3] != 0.0 ||
      matrix[7] != 0.0 ||
      matrix[11] != 0.0 ||
      matrix[15] != 1.0) {
    return false;
  }

  if (matrix.determinant() == 0.0) {
    return false;
  }

  matrix.decompose(_translation, _rotation, _scale);
  _matrix.setFromTranslationRotationScale(_translation, _rotation, _scale);
  return absoluteError(_matrix, matrix) < 0.00005;
}

bool isPot(int value) => (value != 0) && (value & (value - 1) == 0);

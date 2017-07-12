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

library gltf.core.technique;

import 'gltf_property.dart';
import 'package:gltf/src/gl.dart' as gl;

class Technique extends GltfChildOfRootProperty implements Linkable {
  final Map<String, TechniqueParameter> parameters;
  final String _programId;
  final Map<String, String> _attributesIds;
  final Map<String, TechniqueParameter> attributes;
  final Map<String, String> _uniformsIds;
  final Map<String, TechniqueParameter> uniforms;
  final TechniqueStates states;

  Program program;

  Technique._(
      this.parameters,
      this._attributesIds,
      this.attributes,
      this._programId,
      this._uniformsIds,
      this.uniforms,
      this.states,
      String name,
      Map<String, Object> extensions,
      Object extras)
      : super(name, extensions, extras);

  String toString([_]) => super.toString({
        PARAMETERS: parameters,
        PROGRAM: _programId,
        ATTRIBUTES: _attributesIds,
        UNIFORMS: _uniformsIds,
        STATES: states
      });

  static Technique fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, TECHNIQUE_MEMBERS, context);

    final parameters = <String, TechniqueParameter>{};
    final parameterMaps = getMap(map, PARAMETERS, context);
    if (parameterMaps.isNotEmpty) {
      context.path.add(PARAMETERS);
      for (final k in parameterMaps.keys) {
        final parameterMap = getMap(parameterMaps, k, context, req: true);
        if (parameterMap == null) continue;

        context.path.add(k);
        parameters[k] = new TechniqueParameter.fromMap(parameterMap, context);
        context.path.removeLast();
      }
      context.path.removeLast();
    }

    final attributes = <String, TechniqueParameter>{};
    final attributeIds = getStringMap(map, ATTRIBUTES, context);

    if (attributeIds.isNotEmpty) {
      context.path.add(ATTRIBUTES);
      attributeIds.forEach((id, parameterId) {
        if (parameterId is String) {
          final parameter = parameters[parameterId];
          if (parameter != null) {
            attributes[id] = parameter;
          } else if (context.validate) {
            context.addIssue(GltfError.UNRESOLVED_REFERENCE,
                name: id, args: [parameterId]);
          }
        } else if (context.validate) {
          context.addIssue(GltfError.TYPE_MISMATCH,
              name: id, args: [parameterId, "string"]);
        }
      });
      context.path.removeLast();
    }

    final uniforms = <String, TechniqueParameter>{};
    final uniformIds = getStringMap(map, UNIFORMS, context);

    if (uniformIds.isNotEmpty) {
      context.path.add(UNIFORMS);
      uniformIds.forEach((id, parameterId) {
        if (parameterId is String) {
          final parameter = parameters[parameterId];
          if (parameter != null) {
            uniforms[id] = parameter;
          } else if (context.validate) {
            context.addIssue(GltfError.UNRESOLVED_REFERENCE,
                name: id, args: [parameterId]);
          }
        } else if (context.validate) {
          context.addIssue(GltfError.TYPE_MISMATCH,
              name: id, args: [parameterId, "string"]);
        }
      });
      context.path.removeLast();
    }

    final statesMap = getMap(map, STATES, context);
    context.path.add(STATES);
    final states = new TechniqueStates.fromMap(statesMap, context);
    context.path.removeLast();

    return new Technique._(
        parameters,
        attributeIds,
        attributes,
        getId(map, PROGRAM, context),
        uniformIds,
        uniforms,
        states,
        getName(map, context),
        getExtensions(map, Technique, context),
        getExtras(map));
  }

  void link(Gltf gltf, Context context) {
    program = gltf.programs[_programId];

    if (context.validate) {
      if (program == null) {
        context.addIssue(GltfError.UNRESOLVED_REFERENCE,
            name: PROGRAM, args: [_programId]);
      } else {
        if (_attributesIds.isNotEmpty) {
          context.path.add(ATTRIBUTES);
          for (final id in _attributesIds.keys) {
            if (!program.attributes.contains(id)) {
              context.addIssue(GltfError.VALUE_NOT_IN_LIST,
                  args: [id, program.attributes]);
            }
          }
          context.path.removeLast();
        }
      }
    }

    if (parameters.isNotEmpty) {
      // Temp cache for checking already seen attribute semantic types
      final semanticsTypes = context.validate ? <String, int>{} : null;

      context.path.add(PARAMETERS);
      parameters.forEach((id, parameter) {
        context.path.add(id);

        if (parameter._nodeId != null) {
          parameter.node = gltf.nodes[parameter._nodeId];

          if (context.validate && parameter.node == null) {
            context.addIssue(GltfError.UNRESOLVED_REFERENCE,
                name: NODE, args: [parameter._nodeId]);
          }
        }

        if (context.validate) {
          final isAttributeParameter = _attributesIds.containsValue(id);
          final isUniformParameter = _uniformsIds.containsValue(id);

          if (isAttributeParameter && isUniformParameter) {
            context.addIssue(GltfError.TECHNIQUE_AMBIGUOUS_PARAMETER);
          } else if (isAttributeParameter) {
            if (parameter.count != null) {
              context.addIssue(GltfError.TECHNIQUE_ATTRIBUTE_COUNT);
            }

            if (parameter.node != null) {
              context.addIssue(GltfError.TECHNIQUE_ATTRIBUTE_NODE);
            }

            if (parameter.value != null) {
              context.addIssue(GltfError.TECHNIQUE_ATTRIBUTE_VALUE);
            }

            if (parameter.semantic == null) {
              context.addIssue(GltfError.UNDEFINED_PROPERTY, name: SEMANTIC);
            } else {
              if (!ATTRIBUTE_SEMANTIC_MEMBERS.contains(parameter.semantic) &&
                  !parameter.semantic.startsWith("_")) {
                final semParts = parameter.semantic.split("_");
                if (!(ATTRIBUTE_SEMANTIC_ARRAY_MEMBERS.contains(semParts[0]) &&
                    semParts.length == 2 &&
                    int.parse(semParts[1], onError: (_) => -1) != -1)) {
                  context.addIssue(GltfError.TECHNIQUE_INVALID_SEMANTIC,
                      name: SEMANTIC, args: [parameter.semantic]);
                }
              }
            }

            if (!ATTRIBUTE_TYPES.keys.contains(parameter.type)) {
              context.addIssue(GltfError.TECHNIQUE_ATTRIBUTE_INVALID_TYPE,
                  name: TYPE, args: [gl.TYPE_NAMES[parameter.type]]);
            }

            if (parameter.type !=
                semanticsTypes.putIfAbsent(
                    parameter.semantic, () => parameter.type))
              context.addIssue(GltfError.TECHNIQUE_ATTRIBUTE_TYPE_OVERRIDE,
                  name: TYPE, args: [parameter.semantic]);
          } else if (isUniformParameter) {
            if (parameter.node != null && parameter.type != gl.FLOAT_MAT4) {
              context.addIssue(GltfError.TECHNIQUE_UNIFORM_NODE_TYPE);
            }

            if (parameter._value != null && parameter.type == gl.SAMPLER_2D) {
              for (int i = 0; i < parameter.value.length; i++) {
                final texture = gltf.textures[parameter._value[i]];
                if (texture == null) {
                  context.addIssue(GltfError.UNRESOLVED_REFERENCE,
                      name: "$VALUE[$i]", args: [parameter._value[i]]);
                } else {
                  parameter.value[i] = texture;
                }
              }
            }

            if (parameter.semantic != null) {
              final semantic = UNIFORM_SEMANTICS[parameter.semantic] ??
                  context.extensionsUniformParameterSemantics[
                      parameter.semantic];

              if (semantic != null) {
                if (parameter.type != semantic.type) {
                  context.addIssue(GltfError.TECHNIQUE_UNIFORM_SEMANTIC_TYPE,
                      args: [
                        gl.TYPE_NAMES[parameter.type],
                        parameter.semantic
                      ]);
                }

                if (!semantic.isArray && parameter.count != null) {
                  context.addIssue(GltfError.TECHNIQUE_UNIFORM_SEMANTIC_COUNT,
                      name: COUNT, args: [parameter.semantic]);
                } else if (semantic.isArray && parameter.count == null) {
                  context.addIssue(
                      GltfError.TECHNIQUE_UNIFORM_SEMANTIC_NO_COUNT,
                      name: COUNT,
                      args: [parameter.semantic]);
                }
              } else {
                context.addIssue(GltfError.TECHNIQUE_INVALID_SEMANTIC,
                    name: SEMANTIC, args: [parameter.semantic]);
              }
            }
          } else {
            context.addIssue(GltfError.TECHNIQUE_UNUSED_PARAMETER);
          }
        }
        context.path.removeLast();
      });
      context.path.removeLast();
    }
  }
}

class TechniqueParameter extends GltfProperty {
  final int count;
  final String _nodeId;
  final int type;
  final String semantic;
  final List<Object> value;
  final List<Object> _value;

  Node node;

  TechniqueParameter._(this.count, this._nodeId, this.type, this.semantic,
      this._value, this.value, Map<String, Object> extensions, Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString({
        TYPE: type,
        COUNT: count,
        NODE: _nodeId,
        SEMANTIC: semantic,
        VALUE: _value
      });

  factory TechniqueParameter.fromMap(Map<String, Object> map, Context context) {
    if (context.validate)
      checkMembers(map, TECHNIQUE_PARAMETER_MEMBERS, context);

    final type =
        getInt(map, TYPE, context, list: gl.TYPE_LENGTHS.keys, req: true);

    final count = getInt(map, COUNT, context, min: 1);

    List value;
    List _value;
    if (type != null) {
      if (type == gl.SAMPLER_2D) {
        _value = getStringList(map, VALUE, context, lengthsList: [count ?? 1]);
        value = new List<Texture>(count ?? 1);
      } else if (gl.BOOL_TYPES.contains(type)) {
        _value = getBoolList(map, VALUE, context,
            lengthsList: [(count ?? 1) * gl.TYPE_LENGTHS[type]]);
        value = _value;
      } else if (gl.FLOAT_TYPES.contains(type)) {
        _value = getNumList(map, VALUE, context,
            lengthsList: [(count ?? 1) * gl.TYPE_LENGTHS[type]]);
        value = _value;
      } else if (gl.INT_TYPES.contains(type)) {
        _value = getGlIntList(map, VALUE, context,
            length: (count ?? 1) * gl.TYPE_LENGTHS[type], type: type);
        value = _value;
      }
    }

    return new TechniqueParameter._(
        count,
        getId(map, NODE, context, req: false),
        type,
        getString(map, SEMANTIC, context),
        _value,
        value,
        getExtensions(map, TechniqueParameter, context),
        getExtras(map));
  }
}

class TechniqueStates extends GltfProperty {
  final List<int> enable;
  final TechniqueStatesFunctions functions;

  TechniqueStates._(this.enable, this.functions, Map<String, Object> extensions,
      Object extras)
      : super(extensions, extras);

  String toString([_]) =>
      super.toString({ENABLE: enable, FUNCTIONS: functions});

  factory TechniqueStates.fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, TECHNIQUE_STATES_MEMBERS, context);

    const List<int> enablesEnum = const <int>[
      gl.BLEND,
      gl.CULL_FACE,
      gl.DEPTH_TEST,
      gl.POLYGON_OFFSET_FILL,
      gl.SAMPLE_ALPHA_TO_COVERAGE
    ];

    final enable =
        getNumList(map, ENABLE, context, def: <int>[], list: enablesEnum)
        as dynamic/*=List<int>*/;

    if (context.validate && enable != null) {
      checkDuplicates(enable, ENABLE, context);
    }

    final functionsMap = getMap(map, FUNCTIONS, context);

    context.path.add(FUNCTIONS);
    final functions =
        new TechniqueStatesFunctions.fromMap(functionsMap, context);
    context.path.removeLast();

    return new TechniqueStates._(enable, functions,
        getExtensions(map, TechniqueStates, context), getExtras(map));
  }
}

class TechniqueStatesFunctions extends GltfProperty {
  final List<num> blendColor;
  final List<int> blendEquationSeparate;
  final List<int> blendFuncSeparate;
  final List<bool> colorMask;
  final List<int> cullFace;
  final List<int> depthFunc;
  final List<bool> depthMask;
  final List<num> depthRange;
  final List<int> frontFace;
  final List<num> lineWidth;
  final List<num> polygonOffset;
  final List<num> scissor;

  TechniqueStatesFunctions._(
      this.blendColor,
      this.blendEquationSeparate,
      this.blendFuncSeparate,
      this.colorMask,
      this.cullFace,
      this.depthFunc,
      this.depthMask,
      this.depthRange,
      this.frontFace,
      this.lineWidth,
      this.polygonOffset,
      this.scissor,
      Map<String, Object> extensions,
      Object extras)
      : super(extensions, extras);

  String toString([_]) => super.toString({
        BLEND_COLOR: blendColor,
        BLEND_EQUATION_SEPARATE: blendEquationSeparate,
        BLEND_FUNC_SEPARATE: blendFuncSeparate,
        COLOR_MASK: colorMask,
        CULL_FACE: cullFace,
        DEPTH_FUNC: depthFunc,
        DEPTH_MASK: depthMask,
        DEPTH_RANGE: depthRange,
        FRONT_FACE: frontFace,
        LINE_WIDTH: lineWidth,
        POLYGON_OFFSET: polygonOffset,
        SCISSOR: scissor
      });

  factory TechniqueStatesFunctions.fromMap(
      Map<String, Object> map, Context context) {
    if (context.validate)
      checkMembers(map, TECHNIQUE_STATES_FUNCTIONS_MEMBERS, context);

    const List<int> blendEqEnum = const <int>[
      gl.FUNC_ADD,
      gl.FUNC_SUBTRACT,
      gl.FUNC_REVERSE_SUBTRACT
    ];

    const List<int> blendFuncEnum = const <int>[
      gl.ZERO,
      gl.ONE,
      gl.SRC_COLOR,
      gl.ONE_MINUS_SRC_COLOR,
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.DST_ALPHA,
      gl.ONE_MINUS_DST_ALPHA,
      gl.DST_COLOR,
      gl.ONE_MINUS_DST_COLOR,
      gl.SRC_ALPHA_SATURATE,
      gl.CONSTANT_COLOR,
      gl.ONE_MINUS_CONSTANT_COLOR,
      gl.CONSTANT_ALPHA,
      gl.ONE_MINUS_CONSTANT_ALPHA
    ];

    const List<int> cullFaceEnum = const <int>[
      gl.FRONT,
      gl.BACK,
      gl.FRONT_AND_BACK
    ];

    const List<int> depthFuncEnum = const <int>[
      gl.NEVER,
      gl.LESS,
      gl.LEQUAL,
      gl.EQUAL,
      gl.GREATER,
      gl.NOTEQUAL,
      gl.GEQUAL,
      gl.ALWAYS
    ];

    const List<int> frontFaceEnum = const <int>[gl.CW, gl.CCW];

    final defBlendColor = <num>[0.0, 0.0, 0.0, 0.0];
    final defBlendEq = <int>[gl.FUNC_ADD, gl.FUNC_ADD];
    final defBlendFunc = <int>[gl.ONE, gl.ZERO, gl.ONE, gl.ZERO];
    final defColorMask = <bool>[true, true, true, true];
    final defCullFace = <int>[gl.BACK];
    final defDepthFunc = <int>[gl.LESS];
    final defDepthMask = <bool>[true];
    final defDepthRange = <num>[0.0, 1.0];
    final defFrontFace = <int>[gl.CCW];
    final defLineWidth = <num>[1.0];
    final defPolygonOffset = <num>[0.0, 0.0];
    final defScissor = <num>[0.0, 0.0, 0.0, 0.0];

    final depthRange = getNumList(map, DEPTH_RANGE, context,
        minItems: 2, maxItems: 2, def: defDepthRange, min: 0, max: 1);

    if (depthRange != null && depthRange[0] > depthRange[1]) {
      context.addIssue(GltfError.TECHNIQUE_DEPTHRANGE_VALUES,
          name: DEPTH_RANGE);
    }

    return new TechniqueStatesFunctions._(
        getNumList(map, BLEND_COLOR, context,
            lengthsList: <int>[4], def: defBlendColor, min: 0, max: 1),
        getNumList(map, BLEND_EQUATION_SEPARATE, context,
            lengthsList: <int>[2],
            list: blendEqEnum,
            def: defBlendEq) as dynamic/*=List<int>*/,
        getNumList(map, BLEND_FUNC_SEPARATE, context,
            lengthsList: <int>[4],
            list: blendFuncEnum,
            def: defBlendFunc) as dynamic/*=List<int>*/,
        getBoolList(map, COLOR_MASK, context,
            lengthsList: <int>[4], def: defColorMask),
        getNumList(map, CULL_FACE, context,
            lengthsList: <int>[1],
            list: cullFaceEnum,
            def: defCullFace) as dynamic/*=List<int>*/,
        getNumList(map, DEPTH_FUNC, context,
            lengthsList: <int>[1],
            list: depthFuncEnum,
            def: defDepthFunc) as dynamic/*=List<int>*/,
        getBoolList(map, DEPTH_MASK, context,
            lengthsList: <int>[1], def: defDepthMask),
        depthRange,
        getNumList(map, FRONT_FACE, context,
            lengthsList: <int>[1],
            list: frontFaceEnum,
            def: defFrontFace) as dynamic/*=List<int>*/,
        getNumList(map, LINE_WIDTH, context,
            lengthsList: <int>[1], def: defLineWidth, exclMin: 0),
        getNumList(map, POLYGON_OFFSET, context,
            lengthsList: <int>[2], def: defPolygonOffset),
        getNumList(map, SCISSOR, context,
            lengthsList: <int>[4], def: defScissor),
        getExtensions(map, TechniqueStatesFunctions, context),
        getExtras(map));
  }
}

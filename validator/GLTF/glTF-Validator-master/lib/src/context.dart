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

library gltf.context;

import 'dart:collection';

import 'errors.dart';
import 'base/gltf_property.dart';
import 'ext/extensions.dart';

class Context {
  final bool validate;

  String mimeType;

  final List<GltfIssue> _errors = <GltfIssue>[];
  List<GltfIssue> get errors => new UnmodifiableListView<GltfIssue>(_errors);

  final List<GltfIssue> _warnings = <GltfIssue>[];
  List<GltfIssue> get warnings =>
      new UnmodifiableListView<GltfIssue>(_warnings);

  final List<String> path = <String>[];
  String get pathString => path.join("/");

  final Set<Extension> _userExtensions = new Set<Extension>();

  final Map<Extension, ExtensionOptions> _extensionOptions =
      <Extension, ExtensionOptions>{};

  List<String> _extensionsLoaded;
  List<String> get extensionsLoaded => _extensionsLoaded;

  Map<ExtensionTuple, ExtFuncs> _extensionsFunctions;
  Map<ExtensionTuple, ExtFuncs> get extensionsFunctions => _extensionsFunctions;

  Map<String, Semantic> _extensionsUniformParameterSemantics;
  Map<String, Semantic> get extensionsUniformParameterSemantics =>
      _extensionsUniformParameterSemantics;

  Map<String, Semantic> _extensionsAttributeParameterSemantics;
  Map<String, Semantic> get extensionsAttributeParameterSemantics =>
      _extensionsAttributeParameterSemantics;

  List<String> _extensionsUsed;
  List<String> get extensionsUsed => _extensionsUsed;

  List<String> _glExtensionsUsed = <String>[];
  List<String> get glExtensionsUsed => _glExtensionsUsed;

  void registerExtensions(List<Extension> userExtensions) {
    _userExtensions.addAll(userExtensions);
  }

  void addExtensionOptions(ExtensionOptions options) {
    _extensionOptions[options.extension] = options;
  }

  ExtensionOptions getExtensionOptions(Extension extension) =>
      _extensionOptions[extension];

  void initGlExtensions(List<String> glExtensionsUsed) {
    if (validate) checkDuplicates(glExtensionsUsed, GL_EXTENSIONS_USED, this);

    _glExtensionsUsed = new List<String>.unmodifiable(glExtensionsUsed);
  }

  void initExtensions(List<String> extensionsUsed) {
    final extensionsFunctions = <ExtensionTuple, ExtFuncs>{};
    final extensionsUniformParameterSemantics = <String, Semantic>{};
    final extensionsAttributeParameterSemantics = <String, Semantic>{};

    final extensionsNames = <String>[];

    final extensionsSet = new Set<String>.from(extensionsUsed);

    if (extensionsSet.length != extensionsUsed.length)
      addIssue(GltfWarning.DUPLICATE_ELEMENTS, name: EXTENSIONS_USED);

    _extensionsUsed = new List<String>.unmodifiable(extensionsSet);

    for (final extensionName in _extensionsUsed) {
      final extension = _userExtensions.firstWhere(
          (extension) => extension.name == extensionName,
          orElse: () => defaultExtensions.firstWhere(
              (extension) => extension.name == extensionName,
              orElse: () => null));

      if (extension == null) {
        addIssue(GltfWarning.UNSUPPORTED_EXTENSION,
            name: EXTENSIONS_USED, args: [extensionName]);
        continue;
      }

      extension.functions.forEach((type, funcs) {
        extensionsFunctions[new ExtensionTuple(type, extension.name)] = funcs;
      });

      extension.uniformParameterSemantics.forEach((semantic, semanticProps) {
        if (extensionsUniformParameterSemantics[semantic] != semanticProps) {
          throw "`$extensionName` overrides uniform parameter semantic"
              "`$semantic`, which is already defined by another extension.";
        }

        extensionsUniformParameterSemantics[semantic] = semanticProps;
      });

      extension.attributeParameterSemantics.forEach((semantic, semanticProps) {
        if (extensionsAttributeParameterSemantics[semantic] != semanticProps) {
          throw "`$extensionName` overrides attribute parameter semantic"
              "`$semantic`, which is already defined by another extension.";
        }

        if (!ATTRIBUTE_TYPES.containsKey(semanticProps.type)) {
          throw "`$extensionName` defines invalid GL type "
              "for attribute parameter semantic `$semantic`.";
        }

        extensionsAttributeParameterSemantics[semantic] = semanticProps;
      });

      extensionsNames.add(extensionName);
    }

    _extensionsFunctions =
        new Map<ExtensionTuple, ExtFuncs>.unmodifiable(extensionsFunctions);

    _extensionsUniformParameterSemantics =
        new Map<String, Semantic>.unmodifiable(
            extensionsUniformParameterSemantics);

    _extensionsAttributeParameterSemantics =
        new Map<String, Semantic>.unmodifiable(
            extensionsAttributeParameterSemantics);

    _extensionsLoaded = new List<String>.unmodifiable(extensionsNames);
  }

  void addIssue(String errorString, {String name, List args}) {
    final issue = new GltfIssue(
        errorString, name != null ? "$pathString/$name" : pathString, args);

    switch (issue.severity) {
      case Severity.Error:
        _errors.add(issue);
        break;
      case Severity.Warning:
        _warnings.add(issue);
        break;
    }
  }

  String toString() {
    final sb = new StringBuffer();

    sb.writeln("Validation results:");

    sb.writeln("\tErrors: ${errors.length}");
    for (final e in errors) {
      sb
        ..write("\t\t")
        ..writeln(e);
    }

    sb.writeln("\tWarnings: ${warnings.length}");
    for (final e in warnings) {
      sb
        ..write("\t\t")
        ..writeln(e);
    }

    return sb.toString();
  }

  @Deprecated("Not API part, will remove later")
  void registerErrorMessages(
      Map<String, ErrorFunction> errors, Map<String, ErrorFunction> warnings) {
    GltfError.messages.addAll(errors);
    GltfWarning.messages.addAll(warnings);
  }

  Context({this.validate: true, this.mimeType: "model/gltf+json"});
}

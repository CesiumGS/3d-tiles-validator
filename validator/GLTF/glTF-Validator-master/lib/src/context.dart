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

library gltf.context;

import 'dart:collection';

import 'base/gltf_property.dart';
import 'errors.dart';
import 'ext/extensions.dart';

class Context {
  final bool validate;

  final List<String> path = <String>[];

  Context({this.validate: true}) {
    _extensionsLoadedView = new UnmodifiableListView(_extensionsLoaded);
    _extensionsUsedView = new UnmodifiableListView(_extensionsUsed);
    _extensionsFunctionsView = new UnmodifiableMapView(_extensionsFunctions);
  }

  final Map<ExtensionTuple, ExtFuncs> _extensionsFunctions =
      <ExtensionTuple, ExtFuncs>{};
  Map<ExtensionTuple, ExtFuncs> _extensionsFunctionsView;
  Map<ExtensionTuple, ExtFuncs> get extensionsFunctions =>
      _extensionsFunctionsView;

  final List<String> _extensionsUsed = <String>[];
  List<String> _extensionsUsedView;
  List<String> get extensionsUsed => _extensionsUsedView;

  final List<String> _extensionsLoaded = <String>[];
  List<String> _extensionsLoadedView;
  List<String> get extensionsLoaded => _extensionsLoadedView;

  final Set<Extension> _userExtensions = new Set<Extension>();

  final List<Issue> _issues = <Issue>[];

  Iterable<Issue> get errors =>
      _issues.where((issue) => issue.type.severity == Severity.Error);

  Iterable<Issue> get warnings =>
      _issues.where((issue) => issue.type.severity == Severity.Warning);

  String get pathString => (['#']..addAll(path)).join('/');

  void registerExtensions(List<Extension> userExtensions) {
    _userExtensions.addAll(userExtensions);
  }

  void initExtensions(List<String> extensionsUsed) {
    _extensionsUsed.addAll(extensionsUsed);

    for (final extensionName in extensionsUsed) {
      final extension = _userExtensions.firstWhere(
          (extension) => extension.name == extensionName,
          orElse: () => defaultExtensions.firstWhere(
              (extension) => extension.name == extensionName,
              orElse: () => null));

      if (extension == null) {
        addIssue(LinkError.unsupportedExtension,
            name: EXTENSIONS_USED, args: [extensionName]);
        continue;
      }

      extension.functions?.forEach((type, funcs) {
        _extensionsFunctions[new ExtensionTuple(type, extension.name)] = funcs;
      });
      _extensionsLoaded.add(extensionName);
    }
  }

  void addIssue(IssueType issueType,
      {String name, List<Object> args, int offset, int index}) {
    final token = index != null ? index.toString() : name;
    final path = offset != null
        ? '@$offset'
        : token != null ? '$pathString/$token' : pathString;

    _issues.add(new Issue(issueType, path, args));
  }
}

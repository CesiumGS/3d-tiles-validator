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

library gltf.extensions;

import 'package:quiver/core.dart';

import 'package:gltf/src/base/gltf_property.dart';

// Khronos extensions
import 'package:gltf/src/ext/khr_binary_gltf/khr_binary_gltf.dart';
export 'package:gltf/src/ext/khr_binary_gltf/khr_binary_gltf.dart';
//import 'package:gltf/src/ext/khr_materials_common/khr_materials_common.dart';
//export 'package:gltf/src/ext/khr_materials_common/khr_materials_common.dart';

// Vendor extensions
import 'package:gltf/src/ext/cesium_rtc/cesium_rtc.dart';
export 'package:gltf/src/ext/cesium_rtc/cesium_rtc.dart';
import 'package:gltf/src/ext/web3d_quantized_attributes/web3d_quantized_attributes.dart';
export 'package:gltf/src/ext/web3d_quantized_attributes/web3d_quantized_attributes.dart';

abstract class Extension {
  String get name;
  Map<Type, ExtFuncs> get functions => <Type, ExtFuncs>{};
  Map<String, Semantic> get uniformParameterSemantics =>
      const <String, Semantic>{};
  Map<String, Semantic> get attributeParameterSemantics =>
      const <String, Semantic>{};
  Map<String, ErrorFunction> get errors => const <String, ErrorFunction>{};
  Map<String, ErrorFunction> get warnings => const <String, ErrorFunction>{};

  // Sub-classes should be singletons instead of consts because of
  // https://github.com/dart-lang/sdk/issues/17207
}

abstract class ExtensionOptions {
  Extension get extension;
}

class ExtFuncs {
  final FromMapFunction fromMap;
  final LinkFunction link;
  const ExtFuncs(this.fromMap, this.link);
}

class ExtensionTuple {
  final Type type;
  final String name;
  const ExtensionTuple(this.type, this.name);

  @override
  int get hashCode => hash2(type.hashCode, name.hashCode);

  @override
  bool operator ==(dynamic o) =>
      o is ExtensionTuple && name == o.name && type == o.type;
}

final List<Extension> defaultExtensions = <Extension>[
  new KhrBinaryGltfExtension(),
  new CesiumRtcExtension(),
  new Web3dQuantizedAttributesExtension()
];

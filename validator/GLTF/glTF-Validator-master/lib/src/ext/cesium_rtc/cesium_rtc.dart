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

library gltf.extensions.cesium_rtc;

import 'package:gltf/src/utils.dart';
import 'package:gltf/src/base/gltf_property.dart';
import 'package:gltf/src/ext/extensions.dart';

const String CESIUM_RTC = "CESIUM_RTC";

const String CESIUM_RTC_MODELVIEW = "CESIUM_RTC_MODELVIEW";

const String CENTER = "center";
const List<String> CESIUM_RTC_MEMBERS = const <String>[CENTER];

class CesiumRtc extends Stringable {
  final List<num> center;

  CesiumRtc._(this.center);

  String toString([_]) => super.toString({CENTER: center});

  static CesiumRtc fromMap(Map<String, Object> map, Context context) {
    if (context.validate) checkMembers(map, CESIUM_RTC_MEMBERS, context);
    return new CesiumRtc._(
        getNumList(map, CENTER, context, req: true, lengthsList: [3]));
  }
}

class CesiumRtcExtension extends Extension {
  final String name = CESIUM_RTC;

  final Map<Type, ExtFuncs> functions = <Type, ExtFuncs>{
    Gltf: const ExtFuncs(CesiumRtc.fromMap, null)
  };

  final Map<String, Semantic> uniformParameterSemantics =
      const <String, Semantic>{CESIUM_RTC_MODELVIEW: const Semantic()};

  factory CesiumRtcExtension() => _singleton;

  static CesiumRtcExtension _singleton = new CesiumRtcExtension._();
  CesiumRtcExtension._();
}

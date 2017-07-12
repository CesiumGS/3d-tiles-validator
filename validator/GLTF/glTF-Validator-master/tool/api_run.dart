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

import 'dart:async';
import 'dart:io';
import 'package:gltf/gltf.dart';

const coreFiles = const <String>[
  "data/khronos/2CylinderEngine/glTF/2CylinderEngine.gltf",
  "data/khronos/Box/glTF/Box.gltf",
  "data/khronos/BoxAnimated/glTF/BoxAnimated.gltf",
  "data/khronos/BoxSemantics/glTF/BoxSemantics.gltf",
  "data/khronos/BoxTextured/glTF/BoxTextured.gltf",
  "data/khronos/BoxWithoutIndices/glTF/BoxWithoutIndices.gltf",
  "data/khronos/Brainsteam/glTF/Brainsteam.gltf",
  "data/khronos/Buggy/glTF/Buggy.gltf",
  "data/khronos/CesiumMan/glTF/CesiumMan.gltf",
  "data/khronos/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf",
  "data/khronos/Duck/glTF/Duck.gltf",
  "data/khronos/GearboxAssy/glTF/GearboxAssy.gltf",
  "data/khronos/Monster/glTF/Monster.gltf",
  "data/khronos/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf",
  "data/khronos/RiggedFigure/glTF/RiggedFigure.gltf",
  "data/khronos/RiggedSimple/glTF/RiggedSimple.gltf",
  "data/khronos/VC/glTF/VC.gltf"
];

const embeddedFiles = const <String>[
  "data/khronos/2CylinderEngine/glTF-Embedded/2CylinderEngine.gltf",
  "data/khronos/Box/glTF-Embedded/Box.gltf",
  "data/khronos/BoxAnimated/glTF-Embedded/BoxAnimated.gltf",
  "data/khronos/BoxSemantics/glTF-Embedded/BoxSemantics.gltf",
  "data/khronos/BoxTextured/glTF-Embedded/BoxTextured.gltf",
  "data/khronos/BoxWithoutIndices/glTF-Embedded/BoxWithoutIndices.gltf",
  "data/khronos/Brainsteam/glTF-Embedded/Brainsteam.gltf",
  "data/khronos/Buggy/glTF-Embedded/Buggy.gltf",
  "data/khronos/CesiumMan/glTF-Embedded/CesiumMan.gltf",
  "data/khronos/CesiumMilkTruck/glTF-Embedded/CesiumMilkTruck.gltf",
  "data/khronos/Duck/glTF-Embedded/Duck.gltf",
  "data/khronos/GearboxAssy/glTF-Embedded/GearboxAssy.gltf",
  "data/khronos/Monster/glTF-Embedded/Monster.gltf",
  "data/khronos/ReciprocatingSaw/glTF-Embedded/ReciprocatingSaw.gltf",
  "data/khronos/RiggedFigure/glTF-Embedded/RiggedFigure.gltf",
  "data/khronos/RiggedSimple/glTF-Embedded/RiggedSimple.gltf",
  "data/khronos/VC/glTF-Embedded/VC.gltf"
];

const binaryFiles = const <String>[
  "data/khronos/2CylinderEngine/glTF-Binary/2CylinderEngine.glb",
  "data/khronos/Box/glTF-Binary/Box.glb",
  "data/khronos/BoxAnimated/glTF-Binary/BoxAnimated.glb",
  "data/khronos/BoxSemantics/glTF-Binary/BoxSemantics.glb",
  "data/khronos/BoxTextured/glTF-Binary/BoxTextured.glb",
  "data/khronos/BoxWithoutIndices/glTF-Binary/BoxWithoutIndices.glb",
  "data/khronos/Brainsteam/glTF-Binary/Brainsteam.glb",
  "data/khronos/Buggy/glTF-Binary/Buggy.glb",
  "data/khronos/CesiumMan/glTF-Binary/CesiumMan.glb",
  "data/khronos/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
  "data/khronos/Duck/glTF-Binary/Duck.glb",
  "data/khronos/GearboxAssy/glTF-Binary/GearboxAssy.glb",
  "data/khronos/Monster/glTF-Binary/Monster.glb",
  "data/khronos/ReciprocatingSaw/glTF-Binary/ReciprocatingSaw.glb",
  "data/khronos/RiggedFigure/glTF-Binary/RiggedFigure.glb",
  "data/khronos/RiggedSimple/glTF-Binary/RiggedSimple.glb",
  "data/khronos/VC/glTF-Binary/VC.glb"
];

const matCommonFiles = const <String>[
  "data/khronos/2CylinderEngine/glTF-MaterialsCommon/2CylinderEngine.gltf",
  "data/khronos/Box/glTF-MaterialsCommon/Box.gltf",
  "data/khronos/BoxAnimated/glTF-MaterialsCommon/BoxAnimated.gltf",
  "data/khronos/BoxSemantics/glTF-MaterialsCommon/BoxSemantics.gltf",
  "data/khronos/BoxTextured/glTF-MaterialsCommon/BoxTextured.gltf",
  "data/khronos/BoxWithoutIndices/glTF-MaterialsCommon/BoxWithoutIndices.gltf",
  "data/khronos/Brainsteam/glTF-MaterialsCommon/Brainsteam.gltf",
  "data/khronos/Buggy/glTF-MaterialsCommon/Buggy.gltf",
  "data/khronos/CesiumMan/glTF-MaterialsCommon/CesiumMan.gltf",
  "data/khronos/CesiumMilkTruck/glTF-MaterialsCommon/CesiumMilkTruck.gltf",
  "data/khronos/Duck/glTF-MaterialsCommon/Duck.gltf",
  "data/khronos/GearboxAssy/glTF-MaterialsCommon/GearboxAssy.gltf",
  "data/khronos/Monster/glTF-MaterialsCommon/Monster.gltf",
  "data/khronos/ReciprocatingSaw/glTF-MaterialsCommon/ReciprocatingSaw.gltf",
  "data/khronos/RiggedFigure/glTF-MaterialsCommon/RiggedFigure.gltf",
  "data/khronos/RiggedSimple/glTF-MaterialsCommon/RiggedSimple.gltf",
  "data/khronos/VC/glTF-MaterialsCommon/VC.gltf"
];

const fr24Files = const <String>[
  "data/fr24/320.gltf",
  "data/fr24/330.gltf",
  "data/fr24/340.gltf",
  "data/fr24/350.gltf",
  "data/fr24/380.gltf",
  "data/fr24/737.gltf",
  "data/fr24/747.gltf",
  "data/fr24/757.gltf",
  "data/fr24/767.gltf",
  "data/fr24/777.gltf",
  "data/fr24/787.gltf",
  "data/fr24/atr42.gltf",
  "data/fr24/bjet.gltf",
  "data/fr24/c172.gltf",
  "data/fr24/crj700.gltf",
  "data/fr24/crj900.gltf",
  "data/fr24/e170.gltf",
  "data/fr24/e190.gltf",
  "data/fr24/heli.gltf",
  "data/fr24/millennium_falcon.gltf"
];

Future main() async {
  final samples = {
    "Core": coreFiles,
    "Embedded": embeddedFiles,
    "Binary": binaryFiles,
    "Materials Common": matCommonFiles,
    "FR24": fr24Files
  };

  for (final name in samples.keys) {
    final files = samples[name];
    stdout.writeln("$name samples:");
    for (final path in files) {
      try {
        await _load(path);
      } catch (e, st) {
        print(e);
        print(st);
      }
    }
  }
}

Future _load(String filename) async {
  stdout.writeln("Loading $filename...");

  final fileStream = new File(filename).openRead();

  GltfReader reader;
  if (filename.endsWith(".gltf")) {
    reader = new GltfReader(fileStream);
  } else if (filename.endsWith(".glb")) {
    reader = new GlbReader(fileStream);
  } else {
    stderr.write("Unknown file format.");
  }

  try {
    await reader.root;
    stdout.write(reader.context);
  } on Context catch (e) {
    // Failed before Gltf.fromMap call
    stdout.write(e);
  } on FileSystemException catch (e) {
    stderr.writeln(e.message);
  }
}

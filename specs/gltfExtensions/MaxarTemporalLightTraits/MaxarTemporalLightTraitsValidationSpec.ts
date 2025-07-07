import { validateGltf } from "../validateGltf";

describe("MAXAR_temporal_light_traits extension validation", function () {
  it("detects no issues in validTemporalLightTraits", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/validTemporalLightTraits.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects missing waveform property in temporal light traits", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidMissingWaveform.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects invalid waveform value in temporal light traits", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidWaveform.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects undeclared MAXAR_temporal_light_traits extension", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidUndeclaredExtension.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects invalid duty property with sine waveform", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidDutyWithSineWaveform.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects invalid duty property with triangle waveform", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidDutyWithTriangleWaveform.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects no issues with valid duty property and square waveform", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/validDutyWithSquareWaveform.gltf"
    );
    expect(result.length).toEqual(0);
  });
});

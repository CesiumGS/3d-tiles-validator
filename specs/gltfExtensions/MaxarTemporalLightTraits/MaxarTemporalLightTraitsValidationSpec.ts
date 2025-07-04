import { validateGltf } from "../validateGltf";

describe("MAXAR_temporal_light_traits extension validation", function () {
  it("detects no issues in validTemporalLightTraits", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/validTemporalLightTraits.gltf"
    );
    // Should only have info messages, no errors
    let hasErrors = false;
    for (let i = 0; i < result.length; i++) {
      if (result.get(i).severity === "ERROR") {
        hasErrors = true;
        break;
      }
    }
    expect(hasErrors).toBe(false);
  });

  it("detects missing waveform property in temporal light traits", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidMissingWaveform.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the error about missing waveform property
    let foundMissingWaveform = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (
        issue.type === "INVALID_GLTF_STRUCTURE" &&
        issue.message.includes("waveform") &&
        issue.message.includes("required")
      ) {
        foundMissingWaveform = true;
        break;
      }
    }
    expect(foundMissingWaveform).toBe(true);
  });

  it("detects invalid waveform value in temporal light traits", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidWaveform.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the error about invalid waveform value
    let foundInvalidWaveform = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (
        issue.type === "INVALID_GLTF_STRUCTURE" &&
        issue.message.includes("waveform") &&
        (issue.message.includes("sine") ||
          issue.message.includes("square") ||
          issue.message.includes("triangle"))
      ) {
        foundInvalidWaveform = true;
        break;
      }
    }
    expect(foundInvalidWaveform).toBe(true);
  });

  it("detects undeclared MAXAR_temporal_light_traits extension", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidUndeclaredExtension.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the error about undeclared extension
    let foundUndeclaredExtension = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (
        issue.type === "INVALID_GLTF_STRUCTURE" &&
        issue.message.includes("not declared in extensionsUsed")
      ) {
        foundUndeclaredExtension = true;
        break;
      }
    }
    expect(foundUndeclaredExtension).toBe(true);
  });

  it("detects invalid duty property with sine waveform", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidDutyWithSineWaveform.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the error about duty property only applicable for square waveforms
    let foundInvalidDuty = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (
        issue.type === "INVALID_GLTF_STRUCTURE" &&
        issue.message.includes("duty") &&
        issue.message.includes("square")
      ) {
        foundInvalidDuty = true;
        break;
      }
    }
    expect(foundInvalidDuty).toBe(true);
  });

  it("detects invalid duty property with triangle waveform", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/invalidDutyWithTriangleWaveform.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the error about duty property only applicable for square waveforms
    let foundInvalidDuty = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (
        issue.type === "INVALID_GLTF_STRUCTURE" &&
        issue.message.includes("duty") &&
        issue.message.includes("square")
      ) {
        foundInvalidDuty = true;
        break;
      }
    }
    expect(foundInvalidDuty).toBe(true);
  });

  it("detects no issues with valid duty property and square waveform", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/khrLightsPunctual/maxarTemporalLightTraits/validDutyWithSquareWaveform.gltf"
    );
    // Should only have info messages, no errors
    let hasErrors = false;
    for (let i = 0; i < result.length; i++) {
      if (result.get(i).severity === "ERROR") {
        hasErrors = true;
        break;
      }
    }
    expect(hasErrors).toBe(false);
  });
});

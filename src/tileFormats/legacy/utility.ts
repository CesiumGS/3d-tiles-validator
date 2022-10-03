// Ported from https://github.com/CesiumGS/3d-tiles-validator/tree/e84202480eb6572383008076150c8e52c99af3c3
// (Some parts of that state have been omitted here)

function typeToComponentsLength(type: string): number | undefined {
  switch (type) {
    case "SCALAR":
      return 1;
    case "VEC2":
      return 2;
    case "VEC3":
      return 3;
    case "VEC4":
      return 4;
    default:
      return undefined;
  }
}

function componentTypeToByteLength(componentType: string): number | undefined {
  switch (componentType) {
    case "BYTE":
    case "UNSIGNED_BYTE":
      return 1;
    case "SHORT":
    case "UNSIGNED_SHORT":
      return 2;
    case "INT":
    case "UNSIGNED_INT":
    case "FLOAT":
      return 4;
    case "DOUBLE":
      return 8;
    default:
      return undefined;
  }
}

export { typeToComponentsLength, componentTypeToByteLength };

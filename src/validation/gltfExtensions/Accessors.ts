import { GltfData } from "./GltfData";

/**
 * Utility methods related to glTF accessors.
 *
 * NOTE: These methods are only intended for the use in the
 * glTF extension validation. They make assumptions about
 * the validity of the glTF asset (as established by the
 * glTF Validator), and the structure of the glTF asset
 * (as established by the extension validator).
 *
 * @internal
 */
export class Accessors {
  /**
   * Read the values of the given accessor into an array of numbers.
   *
   * This assumes that the accessor has the type SCALAR, and is
   * valid (in terms of its bufferView etc), as validated with
   * the glTF Validator.
   *
   * @param accessor - The glTF accessor
   * @param gltfData - The glTF data
   * @returns The accessor values (or undefined if the input
   * glTF data was invalid)
   */
  static readScalarAccessorValues(
    accessorIndex: number,
    gltfData: GltfData
  ): number[] | undefined {
    const document = gltfData.gltfDocument;
    if (!document) {
      return undefined;
    }
    const root = document.getRoot();
    const accessors = root.listAccessors();
    const accessor = accessors[accessorIndex];
    const count = accessor.getCount();
    const result = [];
    for (let i = 0; i < count; i++) {
      const scalar = accessor.getScalar(i);
      result.push(scalar);
    }
    return result;
  }

  /**
   * Read the values of the given accessor into an array of numbers.
   *
   * This assumes that the accessor has the type SCALAR, and is
   * valid (in terms of its bufferView etc), as validated with
   * the glTF Validator.
   *
   * @param accessorIndex - The glTF accessor index
   * @param gltfData - The glTF data
   * @returns The accessor values (or undefined if the input
   * glTF data was invalid)
   */
  static readScalarAccessorValuesOwn(
    accessorIndex: number,
    gltfData: GltfData
  ): number[] | undefined {
    const gltf = gltfData.gltf;
    const accessors = gltf.accessors || [];
    const accessor = accessors[accessorIndex];
    const bufferViewIndex = accessor.bufferView;
    const bufferViews = gltf.bufferViews || [];
    const bufferView = bufferViews[bufferViewIndex];
    const componentType = accessor.componentType;
    let byteStride = bufferView.byteStride;
    if (byteStride === undefined) {
      byteStride = Accessors.sizeForComponentType(componentType);
      if (byteStride === undefined) {
        // Invalid component type, should have been
        // detected by the glTF-Validator
        return undefined;
      }
    }
    const binaryBufferData = gltfData.binaryBufferData;
    const bufferViewData = binaryBufferData.bufferViewsData[bufferViewIndex];
    const count = accessor.count;
    const byteOffset = accessor.byteOffset;
    const byteLength = count * byteStride;
    const accessorData = bufferViewData.subarray(
      byteOffset,
      byteOffset + byteLength
    );

    const values = [];
    for (let i = 0; i < count; i++) {
      const value = Accessors.readValue(
        accessorData,
        i,
        byteStride,
        componentType
      );
      if (value === undefined) {
        // Invalid component type, should have been
        // detected by the glTF-Validator
        return undefined;
      }
      values.push(value);
    }
    return values;
  }

  /**
   * Returns the size in bytes for the given accessor component type,
   * or undefined if the given component type is not valid.
   *
   * @param componentType - The component type
   * @returns The size in bytes
   */
  private static sizeForComponentType(
    componentType: number
  ): number | undefined {
    const BYTE = 5120;
    const UNSIGNED_BYTE = 5121;
    const SHORT = 5122;
    const UNSIGNED_SHORT = 5123;
    const UNSIGNED_INT = 5125;
    const FLOAT = 5126;
    switch (componentType) {
      case BYTE:
      case UNSIGNED_BYTE:
        return 1;
      case SHORT:
      case UNSIGNED_SHORT:
        return 2;
      case UNSIGNED_INT:
      case FLOAT:
        return 4;
    }
    return undefined;
  }

  /**
   * Read a single numeric value from a buffer that contains
   * the accessor data
   *
   * @param buffer - The buffer
   * @param index - The index
   * @param byteStide - The byte stride
   * @param componentType - The component type
   * @returns The value
   */
  private static readValue(
    buffer: Buffer,
    index: number,
    byteStide: number,
    componentType: number
  ): number | undefined {
    const BYTE = 5120;
    const UNSIGNED_BYTE = 5121;
    const SHORT = 5122;
    const UNSIGNED_SHORT = 5123;
    const UNSIGNED_INT = 5125;
    const FLOAT = 5126;
    const byteOffset = index * byteStide;
    switch (componentType) {
      case BYTE:
        return buffer.readInt8(byteOffset);
      case UNSIGNED_BYTE:
        return buffer.readUint8(byteOffset);
      case SHORT:
        return buffer.readInt16LE(byteOffset);
      case UNSIGNED_SHORT:
        return buffer.readUInt16LE(byteOffset);
      case UNSIGNED_INT:
        return buffer.readUInt32LE(byteOffset);
      case FLOAT:
        return buffer.readFloatLE(byteOffset);
    }
    return undefined;
  }
}

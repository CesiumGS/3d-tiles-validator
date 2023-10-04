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
   * Read the values of the given accessor into an array of
   * arrays of numbers.
   *
   * This assumes that the accessor has the type VECn or MATn, and
   * is valid (in terms of its bufferView etc), as validated with
   * the glTF Validator.
   *
   * @param accessor - The glTF accessor
   * @param gltfData - The glTF data
   * @returns The accessor values (or undefined if the input
   * glTF data was invalid)
   */
  static readArrayAccessorValues(
    accessorIndex: number,
    gltfData: GltfData
  ): number[][] | undefined {
    const document = gltfData.gltfDocument;
    if (!document) {
      return undefined;
    }
    const root = document.getRoot();
    const accessors = root.listAccessors();
    const accessor = accessors[accessorIndex];
    const count = accessor.getCount();
    const elementSize = accessor.getElementSize();
    const result = [];
    for (let i = 0; i < count; i++) {
      const target = Array<any>(elementSize);
      const element = accessor.getElement(i, target);
      result.push(element);
    }
    return result;
  }
}

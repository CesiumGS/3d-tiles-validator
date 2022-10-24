import { BinaryBufferData } from "./BinaryBufferData";

import { BinaryBufferStructure } from "../validation/metadata/BinaryBufferStructure";

import { MetadataClass } from "../structure/Metadata/MetadataClass";
import { PropertyTable } from "../structure/PropertyTable";

/**
 * A basic structure summarizing the (raw) elements of a binary
 * property table.
 *
 * It contains information about the structure of the table itself,
 * consisting of the `PropertyTable` and the `MetadataClass`, as
 * well as the binary data, stored in `Buffer` objects.
 *
 * Instances of this interface serve as the input for the
 * construction of a `PropertyTableModel`.
 *
 * @private
 */
export interface BinaryPropertyTable {
  /**
   * The actual `PropertyTable` object
   */
  propertyTable: PropertyTable;

  /**
   * The `MetadataClass` that corresponds to the `propertyTable.class`
   */
  metadataClass: MetadataClass;

  /**
   * A mapping from enum names to the `valueType` of the respective
   * enum
   */
  enumValueTypes: { [key: string]: string };

  /**
   * The binary buffer structure, containing the `BufferObject` and
   * `BufferView` objects. The `PropertyTableProperty` objects
   * from the `PropertyTable` contain indices (e.g. the `values`
   * index) that refer to this structure.
   */
  binaryBufferStructure: BinaryBufferStructure;

  /**
   * The binary buffer data. These are the actual buffers with
   * the binary data that correspond to the elements of the
   * `BinaryBufferStructure`.
   */
  binaryBufferData: BinaryBufferData;
}

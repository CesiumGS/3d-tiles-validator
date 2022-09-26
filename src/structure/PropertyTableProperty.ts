import { RootProperty } from "./RootProperty";

export interface PropertyTableProperty extends RootProperty {
  values: number;
  arrayOffsets?: number;
  stringOffsets?: number;
  arrayOffsetType?: string;
  stringOffsetType?: string;
  offset: any;
  scale: any;
  max: any;
  min: any;
}

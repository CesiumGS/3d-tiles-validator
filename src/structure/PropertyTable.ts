import { PropertyTableProperty } from "./PropertyTableProperty";

export interface PropertyTable {
  name?: string;
  class: string;
  count: number;
  properties?: { [key: string]: PropertyTableProperty };
}

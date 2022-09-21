import { ClassProperty } from "./ClassProperty";

export interface SchemaClass {
  name?: string;
  description?: string;
  properties?: { [key: string]: ClassProperty };
}

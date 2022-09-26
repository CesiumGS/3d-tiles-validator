import { RootProperty } from "../RootProperty";
import { ClassProperty } from "./ClassProperty";

export interface SchemaClass extends RootProperty {
  name?: string;
  description?: string;
  properties?: { [key: string]: ClassProperty };
}

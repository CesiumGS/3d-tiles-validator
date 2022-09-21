import { SchemaClass } from "./SchemaClass";
import { SchemaEnum } from "./SchemaEnum";

export interface Schema {
  id: string;
  name?: string;
  description?: string;
  version?: string;
  classes?: SchemaClass[];
  enums?: SchemaEnum[];
}

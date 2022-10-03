import { RootProperty } from "../RootProperty";
import { EnumValue } from "./EnumValue";

export interface SchemaEnum extends RootProperty {
  name?: string;
  description?: string;
  valueType?: string;
  values: EnumValue[];
}

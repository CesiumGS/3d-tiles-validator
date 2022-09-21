import { EnumValue } from "./EnumValue";

export interface SchemaEnum {
  name?: string;
  description?: string;
  valueType?: string;
  values: EnumValue[];
}

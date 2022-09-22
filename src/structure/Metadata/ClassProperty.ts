export interface ClassProperty {
  name?: string;
  description?: string;
  type: string;
  componentType?: string;
  enumType?: string;
  array?: boolean;
  count?: number;
  normalized?: boolean;
  offset?: any;
  scale?: any;
  max?: any;
  min?: any;
  required?: boolean;
  noData?: any;
  default?: any;
  semantic?: string;
}
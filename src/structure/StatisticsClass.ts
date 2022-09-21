import { StatisticsClassProperty } from "./StatisticsClassProperty";

export interface StatisticsClass {
  count?: number;
  properties: { [key: string]: StatisticsClassProperty };
}

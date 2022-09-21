import { StatisticsClass } from "./StatisticsClass";

export interface Statistics {
  classes: { [key: string]: StatisticsClass };
}

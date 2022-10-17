import { RootProperty } from "../../structure/RootProperty";

export interface BoundingVolumeS2 extends RootProperty {
  token: string;
  minimumHeight: number;
  maximumHeight: number;
}

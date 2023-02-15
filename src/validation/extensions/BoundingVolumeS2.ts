import { RootProperty } from "3d-tiles-tools";

export interface BoundingVolumeS2 extends RootProperty {
  token: string;
  minimumHeight: number;
  maximumHeight: number;
}

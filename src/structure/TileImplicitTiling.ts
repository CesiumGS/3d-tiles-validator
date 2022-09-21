import { Subtrees } from "./Subtrees";

export interface TileImplicitTiling {
  subdivisionScheme: string;
  subtreeLevels: number;
  availableLevels: number;
  subtrees: Subtrees;
}

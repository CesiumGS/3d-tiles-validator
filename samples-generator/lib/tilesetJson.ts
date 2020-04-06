import { Matrix4 } from 'cesium';
import { AtLeastOne } from './atLeastN';
import { instancesRegion } from './constants';

export interface TilesetJson {
    asset : {
        version: string
        tilesetVersion?: string
    };
    properties?: {[propertyName: string]: {
        minimum: number,
        maximum: number
    }};
    geometricError: number;
    root: {
       content: {
           uri: string
           boundingVolume?: {
               region: number[];
           }
       };
       children?: {
           boundingVolume: {
               region: number[]
           };
           geometricError: number;
           content: {
               uri: string
           };
           extras?: {
               id: string
           }
       }[];
       geometricError: number;
       versionNumber?: string;
       region?: number[];
       box?: object;
       sphere?: object;
       transform?: Matrix4;
       eastNorthUp?: boolean;
       expire?: any;
       refine: string;
       boundingVolume: AtLeastOne<{
           region: number[];
           box: number[];
           sphere: number[];
       }>
    };
    extensionsUsed?: string[];
    extensionsRequired?: string[];
    extensions?: object;
    extras?: {
        name?: string;
    }
}

export type TilesetOption = {
   contentUri: string;
   geometricError: number;
   versionNumber: string;
   region?: number[];
   box?: number[];
   sphere?: number[];
   transform?: object; // Matrix4
   properties?: {[propertyName: string]: {
       minimum: number,
       maximum: number
   }};
   extensions?: object;
   expire?: any;
};

export function getTilesetOpts(
   contentUri: string,
   geometricError: number,
   versionNumber: string,
   region: number[] = instancesRegion
): TilesetOption {
   return {
       contentUri: contentUri,
       geometricError: geometricError,
       versionNumber: versionNumber,
       region: region
   };
}
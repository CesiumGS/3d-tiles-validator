import { Cartesian3, HeadingPitchRoll, Matrix3, Transforms } from 'cesium';

export function metersToLongitude(meters: number, latitude: number): number {
    return (meters * 0.000000156785) / Math.cos(latitude);
}

export function metersToLatitude(meters: number): number {
    return meters * 0.000000157891;
}

export function wgs84Transform(
    longitude: number,
    latitude: number,
    height: number
): Matrix3 {
    return Transforms.headingPitchRollToFixedFrame(
        Cartesian3.fromRadians(longitude, latitude, height),
        new HeadingPitchRoll()
    );
}

export function toCamelCase(s: string): string {
    return s[0].toLowerCase() + s.slice(1);
}

export function typeToNumberOfComponents(type: string): number {
    switch (type) {
        case 'SCALAR':
            return 1;
        case 'VEC2':
            return 2;
        case 'VEC3':
            return 3;
        case 'VEC4':
            return 4;
        case 'MAT2':
            return 4;
        case 'MAT3':
            return 9;
        case 'MAT4':
            return 16;
    }
}

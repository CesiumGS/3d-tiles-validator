
Test data for the bounding volume containment validation.

The content files:

- `unitCube.b3dm` - A unit cube in a B3DM. Hence the name.
- `unitCube.glb` - A unit cube. In a GLB this time. 
- `unitCube.pnts` - A unit cube of 8x8x8 points
- `unitCube-RTC_1_2_3.b3dm` - A unit cube with an `RTC_CENTER` of (1,2,3)
- `unitCube-RTC_1_2_3.pnts` - A unit cube of 8x8x8 points with an `RTC_CENTER` of (1,2,3)
- `unitCubes.i3dm` - Unit cubes with instance positions (0,0,0), (2,0,0), (0,2,0), and (2,2,0)

The tileset files refer to these contents, as indicated by their name.

For B3DM, PNTS, and I3DM content, only simple positive test cases (without
tile transforms, and using bounding boxes) are defined.

Other bounding volume types, non-trivial tile transforms, and negative
test cases are covered with the GLB-based tests.



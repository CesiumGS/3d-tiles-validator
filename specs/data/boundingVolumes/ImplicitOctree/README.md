
Test data for the bounding volume containment validation.

This is a simple implicit octree that contains GLB files in
the "lower half" (z=0 to z=0.5) of the octree, which 
requires the metadata `TILE_BOUNDING_BOX` to be defined as
`[ 0.5, -0.5, 0.25, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.25 ]`
to be valid.


A tileset that refers to a single I3DM file, which in turn refers to a 
single glTF file (the `Box` glTF sample model).

The I3DM refers to the GLB using a URI, in contrast to embedding the 
GLB inside the GLB. 

The URI is `"Box.glb    "`: It includes spaces, as a regression test 
for https://github.com/CesiumGS/3d-tiles-validator/issues/276 .

The string (including spaces) consists of 11 characters. 

In order to achieve the alignment requirement, the payload data is 
padded with _additional_ `0x00` bytes to achieve a payload length 
of 16 bytes. This is not allowed by the specification, and should 
cause a WARNING during the validation.

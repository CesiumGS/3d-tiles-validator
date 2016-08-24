Tools for generating sample 3D Tiles tilesets.

# Make Composite Tile

Creates a composite tile from multiple source tiles.

## Example
`node ./bin/makeCompositeTile.js batched.b3dm instanced.i3dm points.pnts -o output/composite.cmpt`

## Command-Line Flags

| Flag | Description | Required |
| --- | --- | --- |
| `-o`, `--output` | Output path where the composite tile should be written. | No, default `output/composite.cmpt` |
| `-z`, `--gzip` | Gzip the output composite tile. | No, default `false` |

All unflagged arguments are treated as source tiles to place in the composite tile.
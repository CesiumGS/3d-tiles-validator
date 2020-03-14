# 3D Tiles Validator

Node.js library and command-line tools for validating 3D Tiles tilesets.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

## Command line tools

### validate

Validates the input tileset.

```
node ./bin/3d-tiles-validator.js -i ./specs/data/Tileset/tileset.json
```

Validates a single tile.

```
node ./bin/3d-tiles-validator.js -i ./specs/data/Tileset/tile.b3dm
```


|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Tileset JSON file.| Yes |

## Build Instructions

Run the tests:
```
npm run test
```
To run ESLint on the entire codebase, run:
```
npm run eslint
```
To run ESLint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run eslint-watch
```

### Running Test Coverage

Coverage uses [istanbul](https://github.com/gotwarlost/istanbul).  Run:
```
npm run coverage
```
For complete coverage details, open `coverage/lcov-report/index.html`.

The tests and coverage covers the Node.js module; it does not cover the command-line interface.

## Generating Documentation

To generate the documentation:
```
npm run jsDoc
```

The documentation will be placed in the `doc` folder.

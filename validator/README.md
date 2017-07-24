# 3D Tiles Validator

Node.js library and command-line tools for validating 3D Tiles tilesets.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

## Instructions to run GLTF validator as an external process

### Prerequisites:

- Download and install [Dart SDK](https://www.dartlang.org/install) for your platform.(https://www.dartlang.org/install)

- Add Dart SDK bin folder to your [PATH](https://www.dartlang.org/tools/pub/installing).

- Add packages bin folder to your PATH (`~/.pub-cache/bin` for Linux and Mac; `%APPDATA%\Pub\Cache\bin` for Windows).

### glTF-Validator:

- From the repository root folder (go in folder `GLTF/glTF-Validator-master/`), run `pub get` to get dependencies.

- Run `pub global activate --source path ./` to add gltf_validator executable to your PATH.

- On a mac and linux go to `.pub_cache` in your home directory and there you will find the `gltf_validator` executable. Take this executable file and replace the executable in `bin` folder located in your 3D-Tiles validator with it.
For Windows the executable is in the folder `AppData\Roaming\Pub\Cache` and do the same as above.

## Command line tools

### validate

Validates the input tileset.

```
node ./bin/3d-tiles-validator.js ./specs/data/Tileset/
```
```
node ./bin/3d-tiles-validator.js -i ./specs/data/Tileset/
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input directory of the tileset.| No. An input tileset is required but this flag may be omitted|

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

### Debugging

* To debug the tests in Webstorm, open the Gulp tab, right click the `test` task, and click `Debug 'test'`.
* To run a single test, change the test function from `it` to `fit`.
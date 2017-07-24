<p align="center">
<img src="https://github.com/KhronosGroup/glTF/raw/master/specification/figures/gltf.png" />
</p>

# glTF-Validator
Tool to validate [glTF](https://github.com/KhronosGroup/glTF) assets.

Validation is performed against [glTF 2.0](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) specification.

Validator outputs a validation report (in JSON-format) with all found issues and asset stats.

Live drag-n-drop tool (beta): http://github.khronos.org/glTF-Validator
 
## Implemented features

- JSON syntax check and [GLBv2](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) file format correctness.
- Description validation
  - All properties and their types from JSON-Schemas (including implicit limitations on valid values).
  - Validity and compatibility of internal references.
  - Correctness of `Data URI` encoding.
- Binary buffers validation
  - Forbidden or incorrect accessor values (e.g., `NaN`, invalid quaternions, indecomposable matrices, etc).
  - `accessor.min/max` values.
  - Correctness of sparse accessors encoding.
  - Animations inputs and outputs.
- Images validation
  - Channel count compatibility with used materials 
  - Warning on non-power-of-two dimensions

## Usage

You can use hosted [web front-end tool](http://github.khronos.org/glTF-Validator). It works completely in the browser without any server-side processing.

### Command-line tool

#### Installing

##### Prerequisites
1. Download and install [Dart SDK](https://www.dartlang.org/install) for your platform.
2. Add Dart SDK `bin` folder to your PATH (more info [here](https://www.dartlang.org/tools/pub/installing)).
3. Add packages `bin` folder to your PATH (`~/.pub-cache/bin` for Linux and Mac; `%APPDATA%\Pub\Cache\bin` for Windows).

##### glTF-Validator
1. Clone this repository, `master` branch.
2. From the repository root folder, run `pub get` to get dependencies.
3. Run `pub global activate --source path ./` to add `gltf_validator` executable to your PATH.

#### Usage
```
Usage: gltf_validator [<options>] <input>

Validation report will be written to `<asset_filename>_report.json`.
If <input> is a directory, validation reports will be recursively created for each glTF asset.

Validation log will be printed to stderr.

Shell return code will be non-zero if at least one error was found.
-r, --[no-]validate-resources    Validate contents of embedded and/or referenced resources (buffers, images).
-p, --[no-]plain-text            Print issues in plain text form to stderr.
-w, --[no-]warnings              Print warnings to plain text output.
```

## Known Issues

- Web version can't differentiate between true integer values and corresponding floats, e.g., `1` vs `1.0`.
- JSON charset encoding restrictions are not enforced.
- Explicit `null` values are not allowed by JSON-Schemas but could sometimes pass validation as if property was undefined.
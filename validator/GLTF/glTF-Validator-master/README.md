<p align="center">
<img src="https://github.com/KhronosGroup/glTF/raw/master/specification/figures/gltf.png" />
</p>

# glTF-Validator
Tool to validate [glTF](https://github.com/KhronosGroup/glTF) assets.

Validation is performed against [glTF 1.0.1 draft](https://github.com/KhronosGroup/glTF/tree/1.0.1/specification) with `asset.version` check disabled.

Validator outputs a validation report (in JSON-format) with all found issues and asset stats.

Live drag-n-drop tool (beta): http://github.khronos.org/glTF-Validator
 
## Implemented features

- JSON syntax check
- All properties and their types from JSON schemas (including limitations on valid values).
- Validity of internal `id` references.
- Object-specific checks (compatibility of interlinked dictionaries, property combinations, etc).
- Correctness of `Data URI` encoding.
- `.glb` file format from [`KHR_binary_gltf`](https://github.com/KhronosGroup/glTF/tree/master/extensions/Khronos/KHR_binary_glTF) extension.

## Usage

Due to frequent updates, it's recommended to use hosted [web front-end tool](http://github.khronos.org/glTF-Validator). It works completely in the browser without any server-side processing.

### Command-line tool

#### Installing

##### Prerequisites
1. Download and install [Dart SDK](https://www.dartlang.org/install) for your platform.
2. Add Dart SDK `bin` folder to your PATH (more info [here](https://www.dartlang.org/tools/pub/installing)).
3. Add packages `bin` folder to your PATH (`~/.pub-cache/bin` for Linux and Mac; `%APPDATA%\Pub\Cache\bin` for Windows).

##### glTF-Validator
1. Clone this repository, `master` branch.
2. From the repository root folder, run `pub get` to get dependencies.
3. Run `pub global activate --source path ./` to add Validator executable to your PATH.

#### Usage
Run `gltf_validator <asset-file>`. JSON report will be printed to `stdout`.





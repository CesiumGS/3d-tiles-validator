# 3D Tiles Generator

Tools for generating sample 3D Tiles tilesets. The tilesets generated here are included in [3d-tiles-samples](https://github.com/AnalyticalGraphicsInc/3d-tiles-samples) and [Cesium](https://github.com/AnalyticalGraphicsInc/cesium).

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:

```
npm install

node bin/3d-tiles-generator.js
```

This commands generates a series of tilesets and saves them in a folder called `output`. The `Batched`, `Composite`, `Instanced`, `PointCloud`, and `Tilesets` folders may be copied directly to Cesium's `Specs/Data/Cesium3DTiles/` folder for testing with Cesium. The tilesets in the `Samples` folder may be copied to the `tilesets` folder in `3d-tiles-samples`.

For more fine-grained control, edit the following options directly in `3d-tiles-generator.js`. This includes:
* Output directory
* Optimize for Cesium
* Use Cesium RTC extension for b3dm tiles
* Pretty JSON
* Gzip tiles
* Longitude, Latitude, Tile Width

Run the tests:
```
npm run test
```
To run JSHint on the entire codebase, run:
```
npm run jsHint
```
To run JSHint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run jsHint-watch
```

## Contributions

Pull requests are appreciated!  Please use the same [Contributor License Agreement (CLA)](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md) and [Coding Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/CodingGuide/README.md) used for [Cesium](http://cesiumjs.org/).

---

<p align="center">
<a href="http://cesiumjs.org/"><img src="doc/cesium.png" onerror="this.src='cesium.png'"/></a>
</p>

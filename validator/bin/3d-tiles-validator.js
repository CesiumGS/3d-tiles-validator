'use strict';
const Cesium = require('cesium');
const path = require('path');
const yargs = require('yargs');

const isTile = require('../lib/isTile');
const readTile = require('../lib/readTile');
const readTileset = require('../lib/readTileset');
const validateTile = require('../lib/validateTile');
const validateTileset = require('../lib/validateTileset');

const defined = Cesium.defined;

const args = process.argv;
const argv = yargs
    .usage('Usage: node $0 -i <path>')
    .example('node $0 -i tile.b3dm')
    .example('node $0 -i tileset.json')
    .help('h')
    .alias('h', 'help')
    .options({
        input: {
            alias: 'i',
            describe: 'Path to the tileset JSON or tile to validate.',
            normalize: true,
            demandOption: true,
            type: 'string'
        },
        writeReports: {
            alias: 'r',
            describe: 'Write glTF error report next to the glTF file in question.',
            default: false,
            type: 'boolean'
        }
    }).parse(args);

async function validate(argv) {
    const filePath = argv.input;
    const writeReports = argv.writeReports;
    let message;

    try {
        if (isTile(filePath)) {
            message = await validateTile({
                content: await readTile(filePath),
                filePath: filePath,
                directory: path.dirname(filePath),
                writeReports: writeReports
            });
        } else {
            message = await validateTileset({
                tileset: await readTileset(filePath),
                filePath: filePath,
                directory: path.dirname(filePath),
                writeReports: writeReports
            });
        }
    } catch (error) {
        console.log(`Could not read input: ${error.message}`);
        return;
    }

    if (defined(message)) {
        console.log(message);
    } else {
        console.log(`${filePath} is valid`);
    }
}

return validate(argv);

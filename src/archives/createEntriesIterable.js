/* eslint-disable */
"use strict";

const fs = require("fs");

const createFilesIterable = require("./createFilesIterable");
const mapIterable = require("./mapIterable");
const relativizePath = require("./relativizePath");

/**
 * Creates a generator that allows iterating over files in a directory
 * and its subdirectories, and offers them in the form of 'entries'
 * for a 3D Tiles archive.
 *
 * Each entry will have the following properties:
 * - key : The normalized path, relative to the given directory
 * - value : A buffer with the data of the corresponding file
 *
 * @param {fs.PathLike} directory The directory
 * @return The generator for entry objects
 */
function createEntriesIterable(directory) {
  const files = createFilesIterable(directory);

  const createEntry = (file) => {
    const key = relativizePath(directory, file);
    const data = fs.readFileSync(file);
    const entry = {
      key: key,
      value: data,
    };
    return entry;
  };
  return mapIterable(files, createEntry);
}

module.exports = createEntriesIterable;

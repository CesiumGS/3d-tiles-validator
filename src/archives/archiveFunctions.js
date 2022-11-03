/* eslint-disable */
"use strict";

// NOTE: These functions are carved out from
// https://github.com/erikdahlstrom/3d-tiles-tools/blob/0b48a4287df0c0361961c7072f8eec49527df1ac/validator/lib/archive.js
// SEE THE LICENSING INFORMATION IN THIS FILE!
// The functions have been slightly modified here, mainly to omit the
// validation steps
// TODO XXX: The given implementation does not handle hash collisions!

const defined = require("./defined");
const fs = require("fs");
const crypto = require("crypto");

module.exports = {
  readZipIndex: readZipIndex,
  readFileName: readFileName,
  readEntryData: readEntryData,
};

const ZIP_END_OF_CENTRAL_DIRECTORY_HEADER_SIG = 0x06054b50;
const ZIP_START_OF_CENTRAL_DIRECTORY_HEADER_SIG = 0x02014b50;
const ZIP64_EXTENDED_INFORMATION_EXTRA_SIG = 0x0001;
const ZIP_LOCAL_FILE_HEADER_STATIC_SIZE = 30;
const ZIP_CENTRAL_DIRECTORY_STATIC_SIZE = 46;

function getLastCentralDirectoryEntry(fd, stat) {
  const bytesToRead = 320;
  const buffer = Buffer.alloc(bytesToRead);
  const offset = stat.size - bytesToRead;
  const length = bytesToRead;
  fs.readSync(fd, buffer, 0, length, offset);

  let start = 0,
    end = 0;
  for (let i = buffer.length - 4; i > 0; i--) {
    const val = buffer.readUInt32LE(i);
    if (val === ZIP_END_OF_CENTRAL_DIRECTORY_HEADER_SIG) {
      end = i;
    }
    if (val === ZIP_START_OF_CENTRAL_DIRECTORY_HEADER_SIG) {
      start = i;
      break;
    }
  }

  if (start !== end) {
    return buffer.slice(start);
  }
  return undefined;
}

function getFileContents(fd, buffer, expectedFilename) {
  const comp_size = buffer.readUInt32LE(20);
  const filename_size = buffer.readUInt16LE(28);
  const extra_size = buffer.readUInt16LE(30);

  const filename = buffer.toString(
    "utf8",
    ZIP_CENTRAL_DIRECTORY_STATIC_SIZE,
    ZIP_CENTRAL_DIRECTORY_STATIC_SIZE + filename_size
  );
  if (filename !== expectedFilename) {
    throw Error(
      `Central Directory File Header filename was ${filename}, expected ${expectedFilename}`
    );
  }

  let offset = buffer.readUInt32LE(42);
  // if we get this offset, then the offset is stored in the 64 bit extra field
  if (offset === 0xffffffff) {
    let offset64Found = false;
    const endExtrasOffset =
      ZIP_CENTRAL_DIRECTORY_STATIC_SIZE + filename_size + extra_size;
    let currentOffset = ZIP_CENTRAL_DIRECTORY_STATIC_SIZE + filename_size;
    while (!offset64Found && currentOffset < endExtrasOffset) {
      const extra_tag = buffer.readUInt16LE(currentOffset);
      const extra_size = buffer.readUInt16LE(currentOffset + 2);
      if (
        extra_tag === ZIP64_EXTENDED_INFORMATION_EXTRA_SIG &&
        extra_size == 8
      ) {
        offset = buffer.readBigUInt64LE(currentOffset + 4);
        offset64Found = true;
      } else {
        currentOffset += extra_size;
      }
    }
    if (!offset64Found) {
      throw Error("No zip64 extended offset found");
    }
  }

  const localFileDataSize =
    ZIP_LOCAL_FILE_HEADER_STATIC_SIZE +
    filename_size +
    +48 /* over-estimated local file header extra field size, to try and read all data in one go */ +
    comp_size;
  const localFileDataBuffer = Buffer.alloc(localFileDataSize);

  fs.readSync(fd, localFileDataBuffer, 0, localFileDataSize, Number(offset));

  // ok, skip past the filename and extras and we have our data
  const local_comp_size = localFileDataBuffer.readUInt32LE(18);
  const local_filename_size = localFileDataBuffer.readUInt16LE(26);
  const local_extra_size = localFileDataBuffer.readUInt16LE(28);
  const dataStartOffset =
    ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + local_filename_size + local_extra_size;
  const fileDataBuffer = localFileDataBuffer.slice(
    dataStartOffset,
    dataStartOffset + local_comp_size
  );
  if (fileDataBuffer.length === 0) {
    throw Error(`Failed to get file data at offset ${dataStartOffset}`);
  }
  return fileDataBuffer;
}

function parseIndexData(buffer) {
  if (buffer.length % 24 !== 0) {
    console.error(`Bad index buffer length: ${buffer.length}`);
    return -1;
  }
  const numEntries = buffer.length / 24;
  const index = [];
  //console.log(`Zip index contains ${numEntries} entries.`);
  for (let i = 0; i < numEntries; i++) {
    const byteOffset = i * 24;
    const hash = buffer.slice(byteOffset, byteOffset + 16);
    const offset = buffer.readBigUInt64LE(byteOffset + 16);
    index.push({ md5hash: hash, offset: offset });
  }
  return index;
}

function md5LessThan(md5hashA, md5hashB) {
  const aLo = md5hashA.readBigUInt64LE();
  const bLo = md5hashB.readBigUInt64LE();
  if (aLo === bLo) {
    const aHi = md5hashA.readBigUInt64LE(8);
    const bHi = md5hashB.readBigUInt64LE(8);
    return aHi < bHi;
  }
  return aLo < bLo;
}

function zipIndexFind(zipIndex, searchHash) {
  let low = 0;
  let high = zipIndex.length - 1;
  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    const entry = zipIndex[mid];
    //console.log(`mid: ${mid} entry: ${entry.md5hash.toString('hex')}`);
    if (entry.md5hash.compare(searchHash) === 0) {
      return mid;
    } else if (md5LessThan(zipIndex[mid].md5hash, searchHash)) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

function searchIndex(zipIndex, searchPath) {
  const hashedSearchPath = crypto.createHash("md5").update(searchPath).digest();
  //console.log(`Searching index for ${searchPath} (${hashedSearchPath.toString('hex')})`);

  //console.time('Search index');
  const matchedIndex = zipIndexFind(zipIndex, hashedSearchPath);
  //console.log(`matchedIndex: ${matchedIndex}`);
  //console.timeEnd('Search index');
  if (matchedIndex === -1) {
    console.log(
      `Couldn't find ${searchPath} (${hashedSearchPath.toString("hex")})`
    );
    return undefined;
  }

  const entry = zipIndex[matchedIndex];
  //console.log(`Matched index: ${matchedIndex} - offset: ${entry.offset}`);
  return entry;
}

function parseLocalFileHeader(buffer, expectedFilename) {
  const header = {};
  header.signature = buffer.readUInt32LE(0);
  if (header.signature !== 0x04034b50) {
    throw Error(
      `Bad local file header signature: 0x${header.signature.toString(16)}`
    );
  }
  header.comp_size = buffer.readUInt32LE(18);
  header.filename_size = buffer.readUInt16LE(26);
  header.extra_size = buffer.readUInt16LE(28);

  const filename = buffer.toString(
    "utf8",
    ZIP_LOCAL_FILE_HEADER_STATIC_SIZE,
    ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + header.filename_size
  );
  if (filename !== expectedFilename) {
    throw Error(
      `Local File Header filename was ${filename}, expected ${expectedFilename}`
    );
  }

  const compressedSize = header.comp_size;
  if (compressedSize === 0) {
    throw Error("Zip Local File Headers must have non-zero file sizes set.");
  }
  return header;
}

function readZipLocalFileHeader(fd, offset, path) {
  const headerSize = ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + path.length;
  const headerBuffer = Buffer.alloc(headerSize);
  //console.log(`readZipLocalFileHeader path: ${path} headerSize: ${headerSize} offset: ${offset}`);
  fs.readSync(fd, headerBuffer, 0, headerSize, Number(offset));
  //console.log(`headerBuffer: ${result.buffer}`);
  const header = parseLocalFileHeader(headerBuffer, path);
  //console.log(header);
  return header;
}

function normalizePath(path) {
  // on Windows, the paths get backslashes (due to path.join)
  // normalize that to be able to deal with internal zip paths
  let res = path.replace(/\.\//, "");
  return res.replace(/\\/g, "/");
}

function readZipIndex(fd) {
  const stat = fs.fstatSync(fd);
  const centralDirectoryEntryData = getLastCentralDirectoryEntry(fd, stat);
  if (!defined(centralDirectoryEntryData)) {
    throw new Error("Could not read last central directory entry");
  }
  const indexFileName = "@3dtilesIndex1@";
  const indexFileContents = getFileContents(
    fd,
    centralDirectoryEntryData,
    indexFileName
  );
  const zipIndex = parseIndexData(indexFileContents);
  return zipIndex;
}

function readFileName(fd, offset) {
  const headerSize = ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + 320;
  const headerBuffer = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuffer, 0, headerSize, Number(offset));
  const filename_size = headerBuffer.readUInt16LE(26);
  const filename = headerBuffer.toString(
    "utf8",
    ZIP_LOCAL_FILE_HEADER_STATIC_SIZE,
    ZIP_LOCAL_FILE_HEADER_STATIC_SIZE + filename_size
  );
  return filename;
}

function readEntryData(fd, zipIndex, path) {
  const normalizedPath = normalizePath(path);
  const match = searchIndex(zipIndex, normalizedPath);
  if (defined(match)) {
    const header = readZipLocalFileHeader(fd, match.offset, path);
    const fileDataOffset =
      Number(match.offset) +
      ZIP_LOCAL_FILE_HEADER_STATIC_SIZE +
      header.filename_size +
      header.extra_size;
    const fileContentsBuffer = Buffer.alloc(header.comp_size);
    //console.log(`Fetching data at offset ${fileDataOffset} size: ${header.comp_size}`);
    fs.readSync(fd, fileContentsBuffer, 0, header.comp_size, fileDataOffset);
    return fileContentsBuffer;
  }
  //console.log('No entry found for path ', path)
  return undefined;
}

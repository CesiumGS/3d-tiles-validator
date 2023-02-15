import fs from "fs";
import crypto from "crypto";

import StreamZip = require("node-stream-zip");

import { IndexEntry } from "3d-tiles-tools";
import { ArchiveFunctions3tz } from "3d-tiles-tools";

// NOTE: These functions are carved out and ported to TypeScript from
// https://github.com/bjornblissing/3d-tiles-tools/blob/2f4844d5bdd704509bff65199898981228594aaa/validator/lib/archive.js
// TODO: The given implementation does not handle hash collisions!

export class ArchiveValidation3tz {
  private static slowValidateIndex(
    zipIndex: IndexEntry[],
    zipFilePath: string
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise<boolean>((resolve, reject) => {
      let zipFileEntriesCount = 0;
      const zip = new StreamZip({
        file: zipFilePath,
        storeEntries: false,
      });
      zip.on("error", (err: any) => {
        throw err;
      });
      zip.on("ready", () => {
        // console.log(`Total zip entries: ${zip.entriesCount} file entries: ${zipFileEntriesCount}`);
        zip.close();

        if (zipIndex.length !== zipFileEntriesCount) {
          throw Error(
            `Zip index has too few entries, expected ${zipFileEntriesCount} but got ${zipIndex.length}.`
          );
        }

        resolve(true);
      });
      zip.on("entry", (entry: any) => {
        if (entry.isFile && entry.name !== "@3dtilesIndex1@") {
          zipFileEntriesCount++;
          //console.log(`Validating index entry for ${entry.name}`);
          const hash = crypto.createHash("md5").update(entry.name).digest();
          const index = ArchiveFunctions3tz.zipIndexFind(zipIndex, hash);
          if (index === -1) {
            throw Error(`${entry.name} - ${hash} not found in index.`);
          } else {
            const indexEntryOffset = zipIndex[index].offset;
            if (Number(entry.offset) !== Number(indexEntryOffset)) {
              throw Error(
                `${entry.name} - ${hash} had incorrect offset ${indexEntryOffset}, expected ${entry.offset}`
              );
            }
          }
        }
      });
    }).catch((err) => {
      console.error(`Zip index validation failed: ${err}`);
      return false;
    });
  }

  private static md5AsUInt64(md5hashBuffer: Buffer) {
    return [md5hashBuffer.readBigUInt64LE(0), md5hashBuffer.readBigUInt64LE(8)];
  }

  static async validateIndex(
    zipIndex: IndexEntry[],
    zipFilePath: string,
    quick: boolean
  ) {
    console.time("validate index");
    let valid = true;
    const numItems = zipIndex.length;
    if (numItems > 1) {
      const errors: { collisions: number[][] } = {
        collisions: [],
      };
      for (let i = 1; i < numItems; i++) {
        const prevEntry = zipIndex[i - 1];
        const curEntry = zipIndex[i];
        const [curHashHi, curHashLo] = ArchiveValidation3tz.md5AsUInt64(
          curEntry.hash
        );
        if (prevEntry.hash.compare(curEntry.hash) === 0) {
          errors.collisions.push([i - 1, i]);
        }

        const [prevHashHi, prevHashLo] = ArchiveValidation3tz.md5AsUInt64(
          prevEntry.hash
        );

        if (!ArchiveFunctions3tz.md5LessThan(prevEntry.hash, curEntry.hash)) {
          console.warn(
            `Wrong sort order\n${i}: ${curEntry.hash.toString(
              "hex"
            )} (${curHashHi} ${curHashLo}) should be smaller than\n${
              i - 1
            }: ${prevEntry.hash.toString("hex")} (${prevHashHi} ${prevHashLo})`
          );
          valid = false;
        }
      }

      if (errors.collisions.length) {
        for (const c of errors.collisions) {
          console.warn(`Got hash collision at index ${c[0]} and ${c[1]}`);
        }
      }
    }

    const rootHash = crypto.createHash("md5").update("tileset.json").digest();
    const rootIndex = ArchiveFunctions3tz.zipIndexFind(zipIndex, rootHash);
    if (rootIndex === -1) {
      valid = false;
      console.error("Index has no key for the root tileset");
    } else {
      const fd = fs.openSync(zipFilePath, "r");
      try {
        ArchiveFunctions3tz.readZipLocalFileHeader(
          fd,
          zipIndex[rootIndex].offset,
          "tileset.json"
        );
      } catch (err) {
        valid = false;
        console.error(`${err}`);
      }
      fs.closeSync(fd);
    }

    if (!quick && valid) {
      valid = await ArchiveValidation3tz.slowValidateIndex(
        zipIndex,
        zipFilePath
      );
    }

    console.log(`Zip index is ${valid ? "valid" : "invalid"}`);
    console.timeEnd("validate index");
    return valid;
  }
}

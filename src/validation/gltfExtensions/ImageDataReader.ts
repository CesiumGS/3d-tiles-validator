import sharp from "sharp";

import { defined } from "@3d-tiles-tools/base";
import { BinaryBufferData } from "@3d-tiles-tools/base";

import { ImageData } from "./ImageData";
import { ValidationContext } from "../ValidationContext";
import { IoValidationIssues } from "../../issues/IoValidationIssue";

/**
 * A class for reading and accessing `ImageData` instances
 *
 * @internal
 */
export class ImageDataReader {
  /**
   * Read the `ImageData` from the given glTF image.
   *
   * This will read the image data from the `uri` of the given image,
   * or from the `bufferView` of the image.
   *
   * If the data cannot be read, then a validation error will be
   * added to the given context, and `undefined` will be returned.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param image - The glTF `image` object
   * @param binaryBufferData - The `BinaryBufferData` that contains
   * the buffer view data of the glTF
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns The image data, or `undefined`
   */
  static async readFromImage(
    path: string,
    image: any,
    binaryBufferData: BinaryBufferData,
    context: ValidationContext
  ): Promise<ImageData | undefined> {
    // Read the image data buffer, either from a data URI or from
    // the binary buffer data (using the buffer view index)
    let imageDataBuffer;
    const uri = image.uri;
    if (defined(uri)) {
      const resourceResolver = context.getResourceResolver();
      imageDataBuffer = await resourceResolver.resolveData(uri);
    } else {
      const bufferViewIndex = image.bufferView;
      if (defined(bufferViewIndex)) {
        imageDataBuffer = binaryBufferData.bufferViewsData[bufferViewIndex];
      }
    }
    if (!imageDataBuffer) {
      const message = `Could not resolve image data`;
      const issue = IoValidationIssues.IO_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }

    // Try to read image data (pixels) from the image data buffer
    try {
      const imageData = await ImageDataReader.readUnchecked(imageDataBuffer);
      return imageData;
    } catch (error) {
      const message = `Could not read image data: ${error}`;
      const issue = IoValidationIssues.IO_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }
  }

  /**
   * Obtains the value from the specified pixel and channels in the
   * given image data.
   *
   * This is computed by composing the (supposedly `UINT8`) channel
   * values of the pixels
   *
   * @param imageData - The ImageData object
   * @param x - The x-coordinate
   * @param y - The y-coordinate
   * @param channels - The `channels` definition from the texture
   * @returns The value
   */
  static getValue(
    imageData: ImageData,
    x: number,
    y: number,
    channels: number[]
  ) {
    const sizeX = imageData.sizeX;
    const numChannels = imageData.channels;
    const pixels = imageData.pixels;
    let result = 0;
    const offset = (y * sizeX + x) * numChannels;
    for (let c = 0; c < channels.length; c++) {
      const channel = channels[c];
      const shift = c * 8;
      const channelValue = pixels[offset + channel];
      result |= channelValue << shift;
    }
    return result;
  }

  /**
   * Returns the value of the specified channel of the specified pixel
   * in the given image data.
   *
   * @param imageData - The ImageData object
   * @param x - The x-coordinate
   * @param y - The y-coordinate
   * @param channel - The `channel` (usually in [0...3] for RGBA)
   * @returns The value
   */
  static getChannelValue(
    imageData: ImageData,
    x: number,
    y: number,
    channel: number
  ) {
    const sizeX = imageData.sizeX;
    const numChannels = imageData.channels;
    const pixels = imageData.pixels;
    const offset = (y * sizeX + x) * numChannels;
    const channelValue = pixels[offset + channel];
    return channelValue;
  }

  /**
   * Try to read image data from the given buffer.
   *
   * The exact set of image formats that may be contained in the given
   * buffer is not specified. But it will support PNG and JPEG.
   *
   * @param imageDataBuffer - The image data buffer
   * @returns The `ImageData`
   * @throws An error if the image data can not be read
   */
  static async readUnchecked(imageDataBuffer: Buffer): Promise<ImageData> {
    const sharpImage = sharp(imageDataBuffer);
    const metadata = await sharpImage.metadata();
    const sizeX = metadata.width;
    const sizeY = metadata.height;
    const channels = metadata.channels;
    if (sizeX === undefined || sizeY === undefined || channels === undefined) {
      throw new Error("Could not read image metadata");
    }
    const pixelsBuffer = await sharpImage.raw().toBuffer();
    const pixels = [...pixelsBuffer];
    return {
      sizeX: sizeX,
      sizeY: sizeY,
      channels: channels,
      pixels: pixels,
    };
  }
}

import sharp from "sharp";

import { ImageData } from "./ImageData";

/**
 * A class for reading and accessing `ImageData` instances
 *
 * @internal
 */
export class ImageDataReader {
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
   * Try to read image data from the given buffer.
   *
   * The exact set of image formats that may be contained in the given
   * buffer is not specified. But it will support PNG and JPEG.
   *
   * @param imageDataBuffer - The image data buffer
   * @returns The `ImageData`
   * @throws An error if the image data can not be read
   */
  static async readUnchecked(
    imageDataBuffer: Buffer
  ): Promise<ImageData | undefined> {
    const sharpImage = sharp(imageDataBuffer);
    const metadata = await sharpImage.metadata();
    const sizeX = metadata.width;
    const sizeY = metadata.height;
    const channels = metadata.channels;
    if (sizeX === undefined || sizeY === undefined || channels === undefined) {
      return undefined;
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

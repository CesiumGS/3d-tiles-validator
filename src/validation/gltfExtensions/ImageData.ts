/**
 * An internal interface representing the image data
 * that was read for a feature ID- or property texture.
 *
 * @internal
 */
export interface ImageData {
  /**
   * The width of the image
   */
  sizeX: number;

  /**
   * The height of the image
   */
  sizeY: number;

  /**
   * The number of channels (e.g. 3 for RGB, or 4 for RGBA)
   */
  channels: number;

  /**
   * The pixels.
   *
   * The channel `c` of the pixel at `x`, `y` is ndexed
   * by `index = ((y * sizeX) + x) * channels) + c`
   */
  pixels: number[];
}

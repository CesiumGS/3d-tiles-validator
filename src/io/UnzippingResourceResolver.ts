import zlib from "zlib";
import { ResourceResolver } from "./ResourceResolver";
import { ResourceTypes } from "./ResourceTypes";

/**
 * Implementation of a `ResourceResolver` that obtains the resource
 * data from a delegate, and unzips the data if necessary.
 * 
 * @private (Instantiated by the `ResourceResolvers` class)
 */
export class UnzippingResourceResolver implements ResourceResolver {
  private readonly _delegate: ResourceResolver;

  constructor(delegate: ResourceResolver) {
    this._delegate = delegate;
  }

  async resolve(uri: string): Promise<Buffer | null> {
    const delegateData = await this._delegate.resolve(uri);
    if (delegateData === null) {
      return null;
    }
    const isGzipped = ResourceTypes.isGzipped(delegateData);
    if (!isGzipped) {
      return delegateData;
    }
    const data = zlib.gunzipSync(delegateData);
    return data;
  }
  derive(uri: string): ResourceResolver {
    return new UnzippingResourceResolver(this._delegate.derive(uri));
  }
}

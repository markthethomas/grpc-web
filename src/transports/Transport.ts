import "whatwg-fetch";
import {Metadata} from "../grpc";
import fetchRequest from "./fetch";
import xhrRequest from "./xhr";
import mozXhrRequest from "./mozXhr";

export {
  fetchRequest,
  mozXhrRequest,
  xhrRequest
}

export interface CancelFunc {
  (): void
}

export interface Transport {
  (options: TransportOptions): CancelFunc;
}

export type TransportOptions = {
  debug: boolean,
  url: string,
  headers: Metadata,
  body: ArrayBufferView,
  onHeaders: (headers: Metadata, status: number) => void,
  onChunk: (chunkBytes: Uint8Array, flush?: boolean) => void,
  onEnd: (err?: Error) => void,
}

export class DefaultTransportFactory {
  static selected: Transport;
  static getTransport(): Transport {
    if (!this.selected) {
      this.selected = DefaultTransportFactory.detectTransport();
    }
    return this.selected;
  }

  static detectTransport() {
    return fetchRequest;
  }
}
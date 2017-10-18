import { Metadata } from "../grpc";
import fetchRequest from "./fetch";
import xhrRequest from "./xhr";
import mozXhrRequest from "./mozXhr";
export { fetchRequest, mozXhrRequest, xhrRequest };
export interface CancelFunc {
    (): void;
}
export interface Transport {
    (options: TransportOptions): CancelFunc;
}
export declare type TransportOptions = {
    debug: boolean;
    url: string;
    headers: Metadata;
    body: ArrayBufferView;
    onHeaders: (headers: Metadata, status: number) => void;
    onChunk: (chunkBytes: Uint8Array, flush?: boolean) => void;
    onEnd: (err?: Error) => void;
};
export declare class DefaultTransportFactory {
    static selected: Transport;
    static getTransport(): Transport;
    static detectTransport(): typeof fetchRequest;
}

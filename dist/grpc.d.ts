import * as jspb from "google-protobuf";
import { BrowserHeaders as Metadata } from "browser-headers";
import { Transport, TransportOptions } from "./transports/Transport";
import { Code } from "./Code";
export { Metadata, Transport, TransportOptions, Code };
export declare type Request = {
    abort: () => void;
};
export declare namespace grpc {
    interface ProtobufMessageClass<T extends jspb.Message> {
        new (): T;
        deserializeBinary(bytes: Uint8Array): T;
    }
    interface ServiceDefinition {
        serviceName: string;
    }
    interface MethodDefinition<TRequest extends jspb.Message, TResponse extends jspb.Message> {
        methodName: string;
        service: ServiceDefinition;
        requestStream: boolean;
        responseStream: boolean;
        requestType: ProtobufMessageClass<TRequest>;
        responseType: ProtobufMessageClass<TResponse>;
    }
    type UnaryMethodDefinition<TRequest extends jspb.Message, TResponse extends jspb.Message> = MethodDefinition<TRequest, TResponse> & {
        responseStream: false;
    };
    type RpcOptions<TRequest extends jspb.Message, TResponse extends jspb.Message> = {
        host: string;
        request: TRequest;
        metadata?: Metadata.ConstructorArg;
        onHeaders?: (headers: Metadata) => void;
        onMessage?: (res: TResponse) => void;
        onEnd: (code: Code, message: string, trailers: Metadata) => void;
        transport?: Transport;
        debug?: boolean;
    };
    type UnaryOutput<TResponse> = {
        status: Code;
        statusMessage: string;
        headers: Metadata;
        message: TResponse | null;
        trailers: Metadata;
    };
    type UnaryRpcOptions<M extends UnaryMethodDefinition<TRequest, TResponse>, TRequest extends jspb.Message, TResponse extends jspb.Message> = {
        host: string;
        request: TRequest;
        metadata?: Metadata.ConstructorArg;
        onEnd: (output: UnaryOutput<TResponse>) => void;
        transport?: Transport;
        debug?: boolean;
    };
    function unary<TRequest extends jspb.Message, TResponse extends jspb.Message, M extends UnaryMethodDefinition<TRequest, TResponse>>(methodDescriptor: M, props: UnaryRpcOptions<M, TRequest, TResponse>): Request;
    function invoke<TRequest extends jspb.Message, TResponse extends jspb.Message, M extends MethodDefinition<TRequest, TResponse>>(methodDescriptor: M, props: RpcOptions<TRequest, TResponse>): Request;
}

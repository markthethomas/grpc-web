"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var browser_headers_1 = require("browser-headers");
exports.Metadata = browser_headers_1.BrowserHeaders;
var ChunkParser_1 = require("./ChunkParser");
var Transport_1 = require("./transports/Transport");
var debug_1 = require("./debug");
var detach_1 = require("./detach");
var Code_1 = require("./Code");
exports.Code = Code_1.Code;
var grpc;
(function (grpc) {
    function httpStatusToCode(httpStatus) {
        switch (httpStatus) {
            case 0:
                return Code_1.Code.Internal;
            case 200:
                return Code_1.Code.OK;
            case 400:
                return Code_1.Code.InvalidArgument;
            case 401:
                return Code_1.Code.Unauthenticated;
            case 403:
                return Code_1.Code.PermissionDenied;
            case 404:
                return Code_1.Code.NotFound;
            case 409:
                return Code_1.Code.Aborted;
            case 412:
                return Code_1.Code.FailedPrecondition;
            case 429:
                return Code_1.Code.ResourceExhausted;
            case 499:
                return Code_1.Code.Canceled;
            case 500:
                return Code_1.Code.Unknown;
            case 501:
                return Code_1.Code.Unimplemented;
            case 503:
                return Code_1.Code.Unavailable;
            case 504:
                return Code_1.Code.DeadlineExceeded;
            default:
                return Code_1.Code.Unknown;
        }
    }
    function frameRequest(request) {
        var bytes = request.serializeBinary();
        var frame = new ArrayBuffer(bytes.byteLength + 5);
        new DataView(frame, 1, 4).setUint32(0, bytes.length, false);
        new Uint8Array(frame, 5).set(bytes);
        return new Uint8Array(frame);
    }
    function getStatusFromHeaders(headers) {
        var fromHeaders = headers.get("grpc-status") || [];
        if (fromHeaders.length > 0) {
            try {
                var asString = fromHeaders[0];
                return parseInt(asString, 10);
            }
            catch (e) {
                return null;
            }
        }
        return null;
    }
    function unary(methodDescriptor, props) {
        if (methodDescriptor.responseStream) {
            throw new Error(".unary cannot be used with server-streaming methods. Use .invoke instead.");
        }
        var responseHeaders = null;
        var responseMessage = null;
        var rpcOpts = {
            host: props.host,
            request: props.request,
            metadata: props.metadata,
            onHeaders: function (headers) {
                responseHeaders = headers;
            },
            onMessage: function (res) {
                responseMessage = res;
            },
            onEnd: function (status, statusMessage, trailers) {
                props.onEnd({
                    status: status,
                    statusMessage: statusMessage,
                    headers: responseHeaders ? responseHeaders : new browser_headers_1.BrowserHeaders(),
                    message: responseMessage,
                    trailers: trailers
                });
            },
            transport: props.transport,
            debug: props.debug,
        };
        return grpc.invoke(methodDescriptor, rpcOpts);
    }
    grpc.unary = unary;
    function invoke(methodDescriptor, props) {
        var requestHeaders = new browser_headers_1.BrowserHeaders(props.metadata ? props.metadata : {});
        requestHeaders.set("content-type", "application/grpc-web+proto");
        requestHeaders.set("x-grpc-web", "1");
        var framedRequest = frameRequest(props.request);
        var completed = false;
        function rawOnEnd(code, message, trailers) {
            if (completed)
                return;
            completed = true;
            detach_1.default(function () {
                props.onEnd(code, message, trailers);
            });
        }
        function rawOnHeaders(headers) {
            if (completed)
                return;
            detach_1.default(function () {
                if (props.onHeaders) {
                    props.onHeaders(headers);
                }
            });
        }
        function rawOnError(code, msg) {
            if (completed)
                return;
            completed = true;
            detach_1.default(function () {
                props.onEnd(code, msg, new browser_headers_1.BrowserHeaders());
            });
        }
        function rawOnMessage(res) {
            if (completed)
                return;
            detach_1.default(function () {
                if (props.onMessage) {
                    props.onMessage(res);
                }
            });
        }
        var aborted = false;
        var responseHeaders;
        var responseTrailers;
        var parser = new ChunkParser_1.ChunkParser();
        var transport = props.transport;
        if (!transport) {
            transport = Transport_1.DefaultTransportFactory.getTransport();
        }
        var cancelFunc = transport({
            debug: props.debug || false,
            url: props.host + "/" + methodDescriptor.service.serviceName + "/" + methodDescriptor.methodName,
            headers: requestHeaders,
            body: framedRequest,
            onHeaders: function (headers, status) {
                props.debug && debug_1.debug("onHeaders", headers, status);
                if (aborted) {
                    props.debug && debug_1.debug("grpc.onHeaders received after request was aborted - ignoring");
                    return;
                }
                if (status === 0) {
                }
                else {
                    responseHeaders = headers;
                    props.debug && debug_1.debug("onHeaders.responseHeaders", JSON.stringify(responseHeaders, null, 2));
                    var code = httpStatusToCode(status);
                    props.debug && debug_1.debug("onHeaders.code", code);
                    var gRPCMessage = headers.get("grpc-message") || [];
                    props.debug && debug_1.debug("onHeaders.gRPCMessage", gRPCMessage);
                    if (code !== Code_1.Code.OK) {
                        rawOnError(code, gRPCMessage[0]);
                        return;
                    }
                    rawOnHeaders(headers);
                }
            },
            onChunk: function (chunkBytes) {
                if (aborted) {
                    props.debug && debug_1.debug("grpc.onChunk received after request was aborted - ignoring");
                    return;
                }
                var data = [];
                try {
                    data = parser.parse(chunkBytes);
                }
                catch (e) {
                    props.debug && debug_1.debug("onChunk.parsing error", e, e.message);
                    rawOnError(Code_1.Code.Internal, "parsing error: " + e.message);
                    return;
                }
                data.forEach(function (d) {
                    if (d.chunkType === ChunkParser_1.ChunkType.MESSAGE) {
                        var deserialized = methodDescriptor.responseType.deserializeBinary(d.data);
                        rawOnMessage(deserialized);
                    }
                    else if (d.chunkType === ChunkParser_1.ChunkType.TRAILERS) {
                        responseTrailers = new browser_headers_1.BrowserHeaders(d.trailers);
                        props.debug && debug_1.debug("onChunk.trailers", responseTrailers);
                    }
                });
            },
            onEnd: function () {
                props.debug && debug_1.debug("grpc.onEnd");
                if (aborted) {
                    props.debug && debug_1.debug("grpc.onEnd received after request was aborted - ignoring");
                    return;
                }
                if (responseTrailers === undefined) {
                    if (responseHeaders === undefined) {
                        rawOnError(Code_1.Code.Internal, "Response closed without headers");
                        return;
                    }
                    var grpcStatus_1 = getStatusFromHeaders(responseHeaders);
                    var grpcMessage_1 = responseHeaders.get("grpc-message");
                    props.debug && debug_1.debug("grpc.headers only response ", grpcStatus_1, grpcMessage_1);
                    if (grpcStatus_1 === null) {
                        rawOnEnd(Code_1.Code.Internal, "Response closed without grpc-status (Headers only)", responseHeaders);
                        return;
                    }
                    rawOnEnd(grpcStatus_1, grpcMessage_1[0], responseHeaders);
                    return;
                }
                var grpcStatus = getStatusFromHeaders(responseTrailers);
                if (grpcStatus === null) {
                    rawOnError(Code_1.Code.Internal, "Response closed without grpc-status (Trailers provided)");
                    return;
                }
                var grpcMessage = responseTrailers.get("grpc-message");
                rawOnEnd(grpcStatus, grpcMessage[0], responseTrailers);
            }
        });
        var requestObj = {
            abort: function () {
                if (!aborted) {
                    aborted = true;
                    props.debug && debug_1.debug("request.abort aborting request");
                    cancelFunc();
                }
            }
        };
        return requestObj;
    }
    grpc.invoke = invoke;
})(grpc = exports.grpc || (exports.grpc = {}));
//# sourceMappingURL=grpc.js.map
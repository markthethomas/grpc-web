"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var https = require("https");
var url = require("url");
var grpc_1 = require("../grpc");
function nodeHttpRequest(options) {
    options.debug && console.log('httpNodeTransport', options);
    var headers = {};
    options.headers.forEach(function (key, values) {
        headers[key] = values.join(', ');
    });
    var parsedUrl = url.parse(options.url);
    var httpOptions = {
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : undefined,
        path: parsedUrl.path,
        headers: headers,
        method: 'POST'
    };
    var responseCallback = function (response) {
        options.debug && console.log('httpNodeTransport.response', response.statusCode);
        options.onHeaders(new grpc_1.Metadata(response.headers), response.statusCode);
        response.on('data', function (chunk) {
            options.debug && console.log('httpNodeTransport.data', chunk);
            options.onChunk(toArrayBuffer(chunk));
        });
        response.on('end', function () {
            options.debug && console.log('httpNodeTransport.end');
            options.onEnd();
        });
    };
    var request;
    if (parsedUrl.protocol === "https:") {
        request = https.request(httpOptions, responseCallback);
    }
    else {
        request = http.request(httpOptions, responseCallback);
    }
    request.on('error', function (err) {
        options.debug && console.log('httpNodeTransport.error', err);
        options.onEnd(err);
    });
    request.write(toBuffer(options.body));
    request.end();
    return function () {
        options.debug && console.log("httpNodeTransport.abort");
        request.abort();
    };
}
exports.default = nodeHttpRequest;
function toArrayBuffer(buf) {
    var view = new Uint8Array(buf.length);
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i];
    }
    return view;
}
function toBuffer(ab) {
    var buf = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab.buffer);
    for (var i = 0; i < buf.length; i++) {
        buf[i] = view[i];
    }
    return buf;
}
//# sourceMappingURL=nodeHttp.js.map
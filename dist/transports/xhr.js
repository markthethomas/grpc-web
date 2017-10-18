"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var grpc_1 = require("../grpc");
var debug_1 = require("../debug");
var detach_1 = require("../detach");
function xhrRequest(options) {
    options.debug && debug_1.debug("xhrRequest", options);
    var xhr = new XMLHttpRequest();
    var index = 0;
    function onProgressEvent() {
        options.debug && debug_1.debug("xhrRequest.onProgressEvent.length: ", xhr.response.length);
        var rawText = xhr.response.substr(index);
        index = xhr.response.length;
        var asArrayBuffer = stringToArrayBuffer(rawText);
        detach_1.default(function () {
            options.onChunk(asArrayBuffer);
        });
    }
    function onLoadEvent() {
        options.debug && debug_1.debug("xhrRequest.onLoadEvent");
        detach_1.default(function () {
            options.onEnd();
        });
    }
    function onStateChange() {
        var _this = this;
        options.debug && debug_1.debug("xhrRequest.onStateChange", this.readyState);
        if (this.readyState === this.HEADERS_RECEIVED) {
            detach_1.default(function () {
                options.onHeaders(new grpc_1.Metadata(_this.getAllResponseHeaders()), _this.status);
            });
        }
    }
    xhr.open("POST", options.url);
    xhr.responseType = "text";
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    options.headers.forEach(function (key, values) {
        xhr.setRequestHeader(key, values.join(", "));
    });
    xhr.addEventListener("readystatechange", onStateChange);
    xhr.addEventListener("progress", onProgressEvent);
    xhr.addEventListener("loadend", onLoadEvent);
    xhr.addEventListener("error", function (err) {
        options.debug && debug_1.debug("xhrRequest.error", err);
        detach_1.default(function () {
            options.onEnd(err.error);
        });
    });
    xhr.send(options.body);
    return function () {
        options.debug && debug_1.debug("xhrRequest.abort");
        xhr.abort();
    };
}
exports.default = xhrRequest;
function codePointAtPolyfill(str, index) {
    var code = str.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
        var surr = str.charCodeAt(index + 1);
        if (surr >= 0xdc00 && surr <= 0xdfff) {
            code = 0x10000 + ((code - 0xd800) << 10) + (surr - 0xdc00);
        }
    }
    return code;
}
function stringToArrayBuffer(str) {
    var asArray = new Uint8Array(str.length);
    var arrayIndex = 0;
    for (var i = 0; i < str.length; i++) {
        var codePoint = String.prototype.codePointAt ? str.codePointAt(i) : codePointAtPolyfill(str, i);
        asArray[arrayIndex++] = codePoint & 0xFF;
    }
    return asArray;
}
exports.stringToArrayBuffer = stringToArrayBuffer;
//# sourceMappingURL=xhr.js.map
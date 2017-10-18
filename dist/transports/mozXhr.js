"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var grpc_1 = require("../grpc");
var debug_1 = require("../debug");
var detach_1 = require("../detach");
function mozXhrRequest(options) {
    options.debug && debug_1.debug("mozXhrRequest", options);
    var xhr = new XMLHttpRequest();
    function onProgressEvent() {
        options.debug && debug_1.debug("mozXhrRequest.onProgressEvent.length: ", xhr.response.length);
        var resp = xhr.response;
        detach_1.default(function () {
            options.onChunk(new Uint8Array(resp));
        });
    }
    function onLoadEvent() {
        options.debug && debug_1.debug("mozXhrRequest.onLoadEvent");
        detach_1.default(function () {
            options.onEnd();
        });
    }
    function onStateChange() {
        var _this = this;
        options.debug && debug_1.debug("mozXhrRequest.onStateChange", this.readyState);
        if (this.readyState === this.HEADERS_RECEIVED) {
            detach_1.default(function () {
                options.onHeaders(new grpc_1.Metadata(_this.getAllResponseHeaders()), _this.status);
            });
        }
    }
    xhr.open("POST", options.url);
    xhr.responseType = "moz-chunked-arraybuffer";
    options.headers.forEach(function (key, values) {
        xhr.setRequestHeader(key, values.join(", "));
    });
    xhr.addEventListener("readystatechange", onStateChange);
    xhr.addEventListener("progress", onProgressEvent);
    xhr.addEventListener("loadend", onLoadEvent);
    xhr.addEventListener("error", function (err) {
        options.debug && debug_1.debug("mozXhrRequest.error", err);
        detach_1.default(function () {
            options.onEnd(err.error);
        });
    });
    xhr.send(options.body);
    return function () {
        options.debug && debug_1.debug("mozXhrRequest.abort");
        xhr.abort();
    };
}
exports.default = mozXhrRequest;
//# sourceMappingURL=mozXhr.js.map
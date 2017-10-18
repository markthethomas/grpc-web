"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_1 = require("./fetch");
exports.fetchRequest = fetch_1.default;
var xhr_1 = require("./xhr");
exports.xhrRequest = xhr_1.default;
var mozXhr_1 = require("./mozXhr");
exports.mozXhrRequest = mozXhr_1.default;
var nodeHttp_1 = require("./nodeHttp");
var xhr;
function getXHR() {
    if (xhr !== undefined)
        return xhr;
    if (XMLHttpRequest) {
        xhr = new XMLHttpRequest();
        try {
            xhr.open('GET', 'https://localhost');
        }
        catch (e) { }
    }
    return xhr;
}
function xhrSupportsResponseType(type) {
    var xhr = getXHR();
    if (!xhr) {
        return false;
    }
    try {
        xhr.responseType = type;
        return xhr.responseType === type;
    }
    catch (e) { }
    return false;
}
var DefaultTransportFactory = (function () {
    function DefaultTransportFactory() {
    }
    DefaultTransportFactory.getTransport = function () {
        if (!this.selected) {
            this.selected = DefaultTransportFactory.detectTransport();
        }
        return this.selected;
    };
    DefaultTransportFactory.detectTransport = function () {
        if (typeof Response !== "undefined" && Response.prototype.hasOwnProperty("body") && typeof Headers === "function") {
            return fetch_1.default;
        }
        if (typeof XMLHttpRequest !== "undefined") {
            if (xhrSupportsResponseType("moz-chunked-arraybuffer")) {
                return mozXhr_1.default;
            }
            if (XMLHttpRequest.prototype.hasOwnProperty("overrideMimeType")) {
                return xhr_1.default;
            }
        }
        if (typeof module !== "undefined" && module.exports) {
            return nodeHttp_1.default;
        }
        throw new Error("No suitable transport found for gRPC-Web");
    };
    return DefaultTransportFactory;
}());
exports.DefaultTransportFactory = DefaultTransportFactory;
//# sourceMappingURL=Transport.js.map
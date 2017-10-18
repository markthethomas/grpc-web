"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("whatwg-fetch");
var fetch_1 = require("./fetch");
exports.fetchRequest = fetch_1.default;
var xhr_1 = require("./xhr");
exports.xhrRequest = xhr_1.default;
var mozXhr_1 = require("./mozXhr");
exports.mozXhrRequest = mozXhr_1.default;
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
        return fetch_1.default;
    };
    return DefaultTransportFactory;
}());
exports.DefaultTransportFactory = DefaultTransportFactory;
//# sourceMappingURL=Transport.js.map
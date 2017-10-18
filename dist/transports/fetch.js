"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var grpc_1 = require("../grpc");
var debug_1 = require("../debug");
var detach_1 = require("../detach");
function fetchRequest(options) {
    var cancelled = false;
    var reader;
    options.debug && debug_1.debug("fetchRequest", options);
    function pump(readerArg, res) {
        reader = readerArg;
        if (cancelled) {
            options.debug && debug_1.debug("fetchRequest.pump.cancel");
            return reader.cancel();
        }
        return reader.read()
            .then(function (result) {
            if (result.done) {
                detach_1.default(function () {
                    options.onEnd();
                });
                return res;
            }
            detach_1.default(function () {
                options.onChunk(result.value);
            });
            return pump(reader, res);
        });
    }
    fetch(options.url, {
        headers: options.headers.toHeaders(),
        method: "POST",
        body: options.body,
        credentials: "same-origin",
    }).then(function (res) {
        options.debug && debug_1.debug("fetchRequest.response", res);
        detach_1.default(function () {
            options.onHeaders(new grpc_1.Metadata(res.headers), res.status);
        });
        if (res.body) {
            return pump(res.body.getReader(), res);
        }
        return res;
    }).catch(function (err) {
        if (cancelled) {
            options.debug && debug_1.debug("fetchRequest.catch - request cancelled");
            return;
        }
        options.debug && debug_1.debug("fetchRequest.catch", err.message);
        detach_1.default(function () {
            options.onEnd(err);
        });
    });
    return function () {
        if (reader) {
            options.debug && debug_1.debug("fetchRequest.abort.cancel");
            reader.cancel();
        }
        cancelled = true;
    };
}
exports.default = fetchRequest;
//# sourceMappingURL=fetch.js.map
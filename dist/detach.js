"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var awaitingExecution = null;
function runCallbacks() {
    if (awaitingExecution) {
        var thisCallbackSet = awaitingExecution;
        awaitingExecution = null;
        for (var i = 0; i < thisCallbackSet.length; i++) {
            try {
                thisCallbackSet[i]();
            }
            catch (e) {
                if (awaitingExecution === null) {
                    awaitingExecution = [];
                    setTimeout(function () {
                        runCallbacks();
                    }, 0);
                }
                for (var k = thisCallbackSet.length - 1; k > i; k--) {
                    awaitingExecution.unshift(thisCallbackSet[k]);
                }
                throw e;
            }
        }
    }
}
function detach(cb) {
    if (awaitingExecution !== null) {
        awaitingExecution.push(cb);
        return;
    }
    awaitingExecution = [cb];
    setTimeout(function () {
        runCallbacks();
    }, 0);
}
exports.default = detach;
//# sourceMappingURL=detach.js.map
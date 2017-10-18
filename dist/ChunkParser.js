"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var grpc_1 = require("./grpc");
var TextEncoding = require("text-encoding");
var HEADER_SIZE = 5;
var global = Function('return this')();
function isTrailerHeader(headerView) {
    return (headerView.getUint8(0) & 0x80) === 0x80;
}
function parseTrailerData(msgData) {
    var decoder = global.TextDecoder !== undefined ? global.TextDecoder : TextEncoding.TextDecoder;
    return new grpc_1.Metadata(new decoder("utf-8").decode(msgData));
}
function readLengthFromHeader(headerView) {
    return headerView.getUint32(1, false);
}
function hasEnoughBytes(buffer, position, byteCount) {
    return buffer.byteLength - position >= byteCount;
}
function sliceUint8Array(buffer, from, to) {
    if (buffer.slice) {
        return buffer.slice(from, to);
    }
    var end = buffer.length;
    if (to !== undefined) {
        end = to;
    }
    var num = end - from;
    var array = new Uint8Array(num);
    var arrayIndex = 0;
    for (var i = from; i < end; i++) {
        array[arrayIndex++] = buffer[i];
    }
    return array;
}
exports.sliceUint8Array = sliceUint8Array;
var ChunkType;
(function (ChunkType) {
    ChunkType[ChunkType["MESSAGE"] = 1] = "MESSAGE";
    ChunkType[ChunkType["TRAILERS"] = 2] = "TRAILERS";
})(ChunkType = exports.ChunkType || (exports.ChunkType = {}));
var ChunkParser = (function () {
    function ChunkParser() {
        this.buffer = null;
        this.position = 0;
    }
    ChunkParser.prototype.parse = function (bytes, flush) {
        if (bytes.length === 0 && flush) {
            return [];
        }
        var chunkData = [];
        if (this.buffer == null) {
            this.buffer = bytes;
            this.position = 0;
        }
        else if (this.position === this.buffer.byteLength) {
            this.buffer = bytes;
            this.position = 0;
        }
        else {
            var remaining = this.buffer.byteLength - this.position;
            var newBuf = new Uint8Array(remaining + bytes.byteLength);
            var fromExisting = sliceUint8Array(this.buffer, this.position);
            newBuf.set(fromExisting, 0);
            var latestDataBuf = new Uint8Array(bytes);
            newBuf.set(latestDataBuf, remaining);
            this.buffer = newBuf;
            this.position = 0;
        }
        while (true) {
            if (!hasEnoughBytes(this.buffer, this.position, HEADER_SIZE)) {
                return chunkData;
            }
            var headerBuffer = sliceUint8Array(this.buffer, this.position, this.position + HEADER_SIZE);
            var headerView = new DataView(headerBuffer.buffer, headerBuffer.byteOffset, headerBuffer.byteLength);
            var msgLength = readLengthFromHeader(headerView);
            if (!hasEnoughBytes(this.buffer, this.position, HEADER_SIZE + msgLength)) {
                return chunkData;
            }
            var messageData = sliceUint8Array(this.buffer, this.position + HEADER_SIZE, this.position + HEADER_SIZE + msgLength);
            this.position += HEADER_SIZE + msgLength;
            if (isTrailerHeader(headerView)) {
                chunkData.push({ chunkType: ChunkType.TRAILERS, trailers: parseTrailerData(messageData) });
                return chunkData;
            }
            else {
                chunkData.push({ chunkType: ChunkType.MESSAGE, data: messageData });
            }
        }
    };
    return ChunkParser;
}());
exports.ChunkParser = ChunkParser;
//# sourceMappingURL=ChunkParser.js.map
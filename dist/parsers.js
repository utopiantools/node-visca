"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoSystemParser = exports.CamWideDParamsParser = exports.CamImageDataParser = exports.CamLensDataParser = exports.PTStatusParser = exports.PTPosParser = exports.PTMaxSpeedParser = exports.AFIntervalParser = exports.IsOnParser = exports.v2siParser = exports.v2iParser = exports.ByteValParser = exports.NoParser = exports.BaseParser = void 0;
const utils = __importStar(require("./utils"));
const camera_1 = require("./camera");
const constants_1 = require("./constants");
class BaseParser {
}
exports.BaseParser = BaseParser;
// Parsers
class NoParser {
}
exports.NoParser = NoParser;
NoParser.parse = (data) => data;
class ByteValParser {
}
exports.ByteValParser = ByteValParser;
ByteValParser.parse = (data) => data[0];
class v2iParser {
}
exports.v2iParser = v2iParser;
v2iParser.parse = (data) => utils.v2i(data);
class v2siParser {
}
exports.v2siParser = v2siParser;
v2siParser.parse = (data) => utils.v2si(data);
class IsOnParser {
}
exports.IsOnParser = IsOnParser;
IsOnParser.parse = (data) => data == [constants_1.Constants.DATA_ONVAL];
class AFIntervalParser {
}
exports.AFIntervalParser = AFIntervalParser;
AFIntervalParser.parse = (data) => Object.freeze({
    movementTime: utils.v2i(data.slice(0, 2)),
    intervalTime: utils.v2i(data.slice(2, 4)),
});
class PTMaxSpeedParser {
}
exports.PTMaxSpeedParser = PTMaxSpeedParser;
PTMaxSpeedParser.parse = (data) => Object.freeze({ panSpeed: data[0], tiltSpeed: data[1] });
class PTPosParser {
}
exports.PTPosParser = PTPosParser;
PTPosParser.parse = (data) => Object.freeze({ panPos: utils.v2si(data.slice(0, 4)), tiltPos: utils.v2si(data.slice(4, 8)) });
class PTStatusParser {
}
exports.PTStatusParser = PTStatusParser;
PTStatusParser.parse = (data) => camera_1.PTStatus.fromData(data);
class CamLensDataParser {
}
exports.CamLensDataParser = CamLensDataParser;
CamLensDataParser.parse = (data) => camera_1.CamLensData.fromData(data);
class CamImageDataParser {
}
exports.CamImageDataParser = CamImageDataParser;
CamImageDataParser.parse = (data) => camera_1.CamImageData.fromData(data);
class CamWideDParamsParser {
}
exports.CamWideDParamsParser = CamWideDParamsParser;
CamWideDParamsParser.parse = (data) => camera_1.CamWideDParams.fromData(data);
// not implemented yet because this Video System codes are camera
// specific. We would need to implement a parser for every different
// camera individually.
class VideoSystemParser {
}
exports.VideoSystemParser = VideoSystemParser;
VideoSystemParser.parse = (data) => data;
//# sourceMappingURL=parsers.js.map
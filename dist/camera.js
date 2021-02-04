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
exports.Camera = exports.CameraStatus = exports.CamWideDParams = exports.CamImageData = exports.CamLensData = exports.PTStatus = void 0;
const events_1 = require("events");
const command_1 = require("./command");
const constants_1 = require("./constants");
const utils = __importStar(require("./utils"));
class PTStatus {
    constructor() { }
    static fromData(data) {
        let ret = new PTStatus();
        let [p, q, r, s] = utils.nibbles(data);
        ret.moveStatus = (q & constants_1.Constants.PAN_MOVE_FAIL) >> 2;
        ret.initStatus = (p & constants_1.Constants.PAN_INIT_FAIL);
        ret.atMaxL = (s & constants_1.Constants.PAN_MAXL) > 0;
        ret.atMaxR = (s & constants_1.Constants.PAN_MAXR) > 0;
        ret.atMaxU = (s & constants_1.Constants.PAN_MAXU) > 0;
        ret.atMaxD = (s & constants_1.Constants.PAN_MAXD) > 0;
        ret.moving = ret.moveStatus == 1;
        ret.moveDone = ret.moveStatus == 2;
        ret.moveFail = ret.moveStatus == 3;
        ret.initializing = ret.initStatus == 1;
        ret.ready = ret.initStatus == 2;
        ret.fail = ret.initStatus == 3;
        return ret;
    }
}
exports.PTStatus = PTStatus;
class CamLensData {
    constructor() { }
    static fromData(data) {
        let c = new CamLensData();
        c.zoomPos = utils.v2i(data.slice(0, 4));
        c.focusNearLimit = utils.v2i(data.slice(4, 6));
        c.focusPos = utils.v2i(data.slice(6, 10));
        // no data is in byte 10
        let ww = data[11]; // byte 11 is byte 13 of the original full packet
        // 0-normal, 1-interval, 2-trigger
        c.autoFocusMode = (ww & 0b11000) >> 3;
        // 0-slow, 1-normal
        c.autoFocusSensitivity = (ww & 0b100) >> 2;
        c.digitalZoomEnabled = utils.testBit(ww, 0b10);
        c.autoFocusEnabled = utils.testBit(ww, 0b1);
        let vv = data[12];
        c.lowContrast = utils.testBit(vv, 0b1000);
        c.loadingPreset = utils.testBit(vv, 0b100);
        c.focusing = utils.testBit(vv, 0b10);
        c.zooming = utils.testBit(vv, 0b1);
        return c;
    }
}
exports.CamLensData = CamLensData;
class CamImageData {
    constructor() { }
    static fromData(data) {
        let c = new CamImageData();
        c.gainr = utils.v2i(data.slice(0, 2));
        c.gainb = utils.v2i(data.slice(2, 4));
        c.wbMode = data[4];
        c.gain = data[5];
        c.exposureMode = data[6];
        c.shutterPos = data[8];
        c.irisPos = data[9];
        c.gainPos = data[10];
        c.brightness = data[11];
        c.exposureCompPosition = data[12];
        let aa = data[7];
        c.highResEnabled = utils.testBit(aa, 0b100000);
        c.wideDEnabled = utils.testBit(aa, 0b10000);
        c.backlightCompEnabled = utils.testBit(aa, 0b100);
        c.exposureCompEnabled = utils.testBit(aa, 0b10);
        c.slowShutterAutoEnabled = utils.testBit(aa, 0b1);
        return c;
    }
}
exports.CamImageData = CamImageData;
class CamWideDParams {
    constructor() { }
    static fromData(data) {
        let c = new CamWideDParams();
        c.screenDisplay = data[0];
        c.detectionSensitivity = data[1];
        c.shadowCorrectionLevel = data[2];
        c.highlightCorrectionLevel = data[3];
        c.exposureRatio = (data[4] << 4) | data[5]; // 1-64
        return c;
    }
}
exports.CamWideDParams = CamWideDParams;
// TODO: Convert most "number" fields to semantic names
// using an enum or at least semantic map on the constants class
class CameraStatus {
    constructor() { }
    // takes CamImageData
    updateImageData(imageData) {
        this.rGain = imageData.gainr;
        this.bGain = imageData.gainb;
        this.apertureGain = imageData.gain;
        this.wbMode = imageData.wbMode;
        this.exposureMode = imageData.exposureMode;
        this.shutterPos = imageData.shutterPos;
        this.irisPos = imageData.irisPos;
        this.gainPos = imageData.gainPos;
        this.brightness = imageData.brightness;
        this.exposureCompPosition = imageData.exposureCompPosition;
        this.highResEnabled = imageData.highResEnabled;
        this.wideDEnabled = imageData.wideDEnabled;
        this.backlightCompEnabled = imageData.backlightCompEnabled;
        this.exposureCompEnabled = imageData.exposureCompEnabled;
        this.exposureCompPosition = imageData.exposureCompPosition;
        this.slowShutterAutoEnabled = imageData.slowShutterAutoEnabled;
    }
    updateLensData(lensData) {
        this.zooming = lensData.zooming;
        this.zoomPos = lensData.zoomPos;
        this.digitalZoomEnabled = lensData.digitalZoomEnabled;
        this.focusing = lensData.focusing;
        this.focusPos = lensData.focusPos;
        this.focusNearLimit = lensData.focusNearLimit;
        this.autoFocusMode = lensData.autoFocusMode;
        this.autoFocusSensitivity = lensData.autoFocusSensitivity;
        this.autoFocusEnabled = lensData.autoFocusEnabled;
        this.lowContrast = lensData.lowContrast;
        this.loadingPreset = lensData.loadingPreset;
    }
}
exports.CameraStatus = CameraStatus;
class Camera extends events_1.EventEmitter {
    // transport should support the socket interface => .send(ViscaCommand)
    constructor(index, transport) {
        var _a;
        super();
        // typescript only infers these if the constructor arguments
        // use the public or private keyword
        this.index = index;
        this.transport = transport;
        this.cameraBuffers = {};
        this.sentCommands = []; // FIFO stack for commands
        this.commandQueue = [];
        this.inquiryQueue = [];
        this.status = new CameraStatus();
        this.commandReady = true; // true when camera can receive commands
        this.inquiryReady = true;
        // UDPTransports provide a unique uuid
        this.uuid = (_a = transport.uuid) !== null && _a !== void 0 ? _a : index.toString();
    }
    _clear() { this.cameraBuffers = {}; this.sentCommands = []; }
    _update() {
        this.updatetimer = null;
        this._expireOldCommands();
        this._processQueue();
        this.emit('update');
    }
    _updateBooleans() {
        this.commandReady = !('1' in this.cameraBuffers || '2' in this.cameraBuffers);
        this.inquiryReady = !('0' in this.cameraBuffers);
    }
    // if a command in the stack is older than 200ms drop it
    _expireOldCommands() {
        let now = Date.now();
        // the first command is always the oldest
        while (this.sentCommands.length > 0) {
            if (now - this.sentCommands[0].sentAt < constants_1.Constants.COMMAND_TIMEOUT)
                break;
            this.sentCommands.splice(0, 1);
        }
        // check all cameraBuffers
        for (let key of Object.keys(this.cameraBuffers)) {
            if (now - this.cameraBuffers[key].sentAt > constants_1.Constants.COMMAND_TIMEOUT)
                delete this.cameraBuffers[key];
        }
    }
    _processQueue() {
        this._updateBooleans();
        if (this.commandReady && this.commandQueue.length > 0) {
            let [cmd] = this.commandQueue.splice(0, 1);
            this.sendCommand(cmd);
        }
        if (this.inquiryReady && this.inquiryQueue.length > 0) {
            let [cmd] = this.inquiryQueue.splice(0, 1);
            this.sendCommand(cmd);
        }
    }
    _scheduleUpdate() {
        if (this.updatetimer != null)
            return;
        if (this.inquiryQueue.length > 0 || this.commandQueue.length > 0) {
            this.updatetimer = setTimeout(this._update, 25);
        }
    }
    // treat commands that don't send ack as if
    // they were stored in camera socket 0
    // because the parsed response will have socket 0.
    // other commands will be put on the stack until
    // the ack tells us which socket received it
    sendCommand(command) {
        // update the header data
        command.source = 0;
        command.recipient = this.index;
        command.broadcast = false;
        command.addedAt = Date.now();
        let queued = false;
        // INTERFACE_DATA, ADDRESS_SET commands always get sent and aren't tracked
        // keep track of other commands in order, so we can match replies to commands
        if (command.msgType == constants_1.Constants.MSGTYPE_INQUIRY) {
            // only allow one non-ack command at a time
            if (this.inquiryReady) {
                this.cameraBuffers['0'] = command; // no ACK, only complete / error
            }
            else {
                this.inquiryQueue.push(command);
                queued = true;
            }
        }
        else if (command.msgType == constants_1.Constants.MSGTYPE_COMMAND) {
            if (this.commandReady) {
                this.sentCommands.push(command); // not in a buffer until we get ACK
            }
            else {
                this.commandQueue.push(command);
                queued = true;
            }
        }
        if (queued) {
            this._scheduleUpdate();
        }
        else {
            command.sentAt = Date.now();
            this.transport.write(command);
        }
    }
    ack(viscaCommand) {
        // get the first viscaCommand that expects an ACK
        let [cmd] = this.sentCommands.splice(0, 1); // gets the head
        cmd.ack(); // run the command ACK callback if it exists
        this.cameraBuffers[viscaCommand.socket] = cmd;
        this._scheduleUpdate();
    }
    complete(viscaCommand) {
        let key = viscaCommand.socket.toString();
        this.cameraBuffers[key].complete(viscaCommand.data);
        delete this.cameraBuffers[key];
        this._scheduleUpdate();
    }
    error(viscaCommand) {
        let message;
        let errorType = viscaCommand.data[0];
        let socketKey = viscaCommand.socket.toString();
        switch (errorType) {
            case constants_1.Constants.ERROR_SYNTAX:
                message = `syntax error, invalid command`;
                break;
            case constants_1.Constants.ERROR_BUFFER_FULL:
                message = `command buffers full`;
                break;
            case constants_1.Constants.ERROR_CANCELLED:
                // command was cancelled
                message = 'cancelled';
                break;
            case constants_1.Constants.ERROR_INVALID_BUFFER:
                message = `socket cannot be cancelled`;
                break;
            case constants_1.Constants.ERROR_COMMAND_FAILED:
                message = `command failed`;
                break;
        }
        console.log(`camera ${this.index}-${viscaCommand.socket}: ${message}`);
        this.cameraBuffers[socketKey].error(message);
        delete (this.cameraBuffers[socketKey]);
        this._update();
    }
    inquireAll() {
        this.getPower(); // single command
        this.getPTStatus(); // block inquiry command
        this.getLensData(); // block inquiry
        this.getImageData(); // block inquiry
        // multiple individual queries
        this.getPTPos();
        this.getPTSpeed();
        this.getICRMode();
        this.getICRAutoMode();
        this.getICRThreshold();
        this.getGainLimit();
        this.getFocusAutoMode();
        this.getFocusAutoIntervalTime();
        this.getFocusIRCorrection();
        this.getWideDStatus();
        this.getWideDParams();
        this.getNoiseReductionStatus();
        this.getHighSensitivityStatus();
        this.getFreezeStatus();
        this.getEffect();
        this.getEffectDigital();
        this.getEffectDigitalLevel();
        this.getChromaSuppressStatus();
        this.getID();
        this.getColorGain();
        this.getColorHue();
        this.getVideoFormatNow();
        this.getVideoFormatNext();
    }
    // camera specific inquiry commands
    // ---------------- Inquiries ---------------------------
    getPower() { let v = command_1.ViscaCommand.inqCameraPower(this.index, (data) => { this.status.powerStatus = data; }); this.sendCommand(v); }
    getICRMode() { let v = command_1.ViscaCommand.inqCameraICRMode(this.index, (data) => { this.status.icrMode = data; }); this.sendCommand(v); }
    getICRAutoMode() { let v = command_1.ViscaCommand.inqCameraICRAutoMode(this.index, (data) => { this.status.icrAutoMode = data; }); this.sendCommand(v); }
    getICRThreshold() { let v = command_1.ViscaCommand.inqCameraICRThreshold(this.index, (data) => { this.status.icrThreshold = data; }); this.sendCommand(v); }
    getGainLimit() { let v = command_1.ViscaCommand.inqCameraGainLimit(this.index, (data) => { this.status.gainLimit = data; }); this.sendCommand(v); }
    getGain() { let v = command_1.ViscaCommand.inqCameraGain(this.index, (data) => { this.status.apertureGain = data; }); this.sendCommand(v); }
    getGainR() { let v = command_1.ViscaCommand.inqCameraGainR(this.index, (data) => { this.status.rGain = data; }); this.sendCommand(v); }
    getGainB() { let v = command_1.ViscaCommand.inqCameraGainB(this.index, (data) => { this.status.bGain = data; }); this.sendCommand(v); }
    getDZoomMode() { let v = command_1.ViscaCommand.inqCameraDZoomMode(this.index, (data) => { this.status.digitalZoomEnabled = data; }); this.sendCommand(v); }
    getZoomPos() { let v = command_1.ViscaCommand.inqCameraZoomPos(this.index, (data) => { this.status.zoomPos = data; }); this.sendCommand(v); }
    getFocusAutoStatus() { let v = command_1.ViscaCommand.inqCameraFocusAutoStatus(this.index, (data) => { this.status.autoFocusEnabled = data; }); this.sendCommand(v); }
    getFocusAutoMode() { let v = command_1.ViscaCommand.inqCameraFocusAutoMode(this.index, (data) => { this.status.autoFocusMode = data; }); this.sendCommand(v); }
    getFocusIRCorrection() { let v = command_1.ViscaCommand.inqCameraFocusIRCorrection(this.index, (data) => { this.status.focusIRCorrection = data; }); this.sendCommand(v); }
    getFocusPos() { let v = command_1.ViscaCommand.inqCameraFocusPos(this.index, (data) => { this.status.focusPos = data; }); this.sendCommand(v); }
    getFocusNearLimit() { let v = command_1.ViscaCommand.inqCameraFocusNearLimit(this.index, (data) => { this.status.focusNearLimit = data; }); this.sendCommand(v); }
    getFocusAutoIntervalTime() { let v = command_1.ViscaCommand.inqCameraFocusAutoIntervalTime(this.index, (data) => { this.status.autoFocusIntervalTime = data; }); this.sendCommand(v); }
    getFocusSensitivity() { let v = command_1.ViscaCommand.inqCameraFocusSensitivity(this.index, (data) => { this.status.autoFocusSensitivity = data; }); this.sendCommand(v); }
    getWBMode() { let v = command_1.ViscaCommand.inqCameraWBMode(this.index, (data) => { this.status.wbMode = data; }); this.sendCommand(v); }
    getExposureMode() { let v = command_1.ViscaCommand.inqCameraExposureMode(this.index, (data) => { this.status.exposureMode = data; }); this.sendCommand(v); }
    getShutterSlowMode() { let v = command_1.ViscaCommand.inqCameraShutterSlowMode(this.index, (data) => { this.status.slowShutterAutoEnabled = data; }); this.sendCommand(v); }
    getShutter() { let v = command_1.ViscaCommand.inqCameraShutterPos(this.index, (data) => { this.status.shutterPos = data; }); this.sendCommand(v); }
    getIris() { let v = command_1.ViscaCommand.inqCameraIris(this.index, (data) => { this.status.irisPos = data; }); this.sendCommand(v); }
    getBrightness() { let v = command_1.ViscaCommand.inqCameraBrightness(this.index, (data) => { this.status.brightness = data; }); this.sendCommand(v); }
    getExposureCompStatus() { let v = command_1.ViscaCommand.inqCameraExposureCompStatus(this.index, (data) => { this.status.exposureCompEnabled = data; }); this.sendCommand(v); }
    getExposureCompPosition() { let v = command_1.ViscaCommand.inqCameraExposureCompPosition(this.index, (data) => { this.status.exposureCompPosition = data; }); this.sendCommand(v); }
    getBacklightStatus() { let v = command_1.ViscaCommand.inqCameraBacklightStatus(this.index, (data) => { this.status.backlightCompEnabled = data; }); this.sendCommand(v); }
    getWideDStatus() { let v = command_1.ViscaCommand.inqCameraWideDMode(this.index, (data) => { this.status.wideDMode = data; this.status.wideDEnabled = (data != 0); }); this.sendCommand(v); }
    getWideDParams() { let v = command_1.ViscaCommand.inqCameraWideDParams(this.index, (data) => { this.status.wideDParams = data; }); this.sendCommand(v); }
    getAperture() { let v = command_1.ViscaCommand.inqCameraAperture(this.index, (data) => { this.status.apertureGain = data; }); this.sendCommand(v); }
    getHighResStatus() { let v = command_1.ViscaCommand.inqCameraHighResStatus(this.index, (data) => { this.status.highResEnabled = data; }); this.sendCommand(v); }
    getNoiseReductionStatus() { let v = command_1.ViscaCommand.inqCameraNoiseReductionStatus(this.index, (data) => { this.status.noiseReductionLevel = data; }); this.sendCommand(v); }
    getHighSensitivityStatus() { let v = command_1.ViscaCommand.inqCameraHighSensitivityStatus(this.index, (data) => { this.status.highSensitivityEnabled = data; }); this.sendCommand(v); }
    getFreezeStatus() { let v = command_1.ViscaCommand.inqCameraFreezeStatus(this.index, (data) => { this.status.frozen = data; }); this.sendCommand(v); }
    getEffect() { let v = command_1.ViscaCommand.inqCameraEffect(this.index, (data) => { this.status.effect = data; }); this.sendCommand(v); }
    getEffectDigital() { let v = command_1.ViscaCommand.inqCameraEffectDigital(this.index, (data) => { this.status.digitalEffect = data; }); this.sendCommand(v); }
    getEffectDigitalLevel() { let v = command_1.ViscaCommand.inqCameraEffectDigitalLevel(this.index, (data) => { this.status.digitalEffectLevel = data; }); this.sendCommand(v); }
    getID() { let v = command_1.ViscaCommand.inqCameraID(this.index, (data) => { this.status.cameraID = data; }); this.sendCommand(v); }
    getChromaSuppressStatus() { let v = command_1.ViscaCommand.inqCameraChromaSuppressStatus(this.index, (data) => { this.status.chromaSuppressLevel = data; }); this.sendCommand(v); }
    getColorGain() { let v = command_1.ViscaCommand.inqCameraColorGain(this.index, (data) => { this.status.colorGain = data; }); this.sendCommand(v); }
    getColorHue() { let v = command_1.ViscaCommand.inqCameraColorHue(this.index, (data) => { this.status.colorHue = data; }); this.sendCommand(v); }
    // these use op commands
    getVideoFormatNow() { let v = command_1.ViscaCommand.inqVideoFormatNow(this.index, (data) => { this.status.videoFormatNow = data; }); this.sendCommand(v); }
    getVideoFormatNext() { let v = command_1.ViscaCommand.inqVideoFormatNext(this.index, (data) => { this.status.videoFormatNext = data; }); this.sendCommand(v); }
    getPTPos() { let v = command_1.ViscaCommand.inqCameraPanTiltPos(this.index, (data) => { this.status.ptPos = data; }); this.sendCommand(v); }
    getPTSpeed() { let v = command_1.ViscaCommand.inqCameraPanTiltSpeed(this.index, (data) => { this.status.ptSpeed = data; }); this.sendCommand(v); }
    getPTStatus() { let v = command_1.ViscaCommand.inqCameraPanTiltStatus(this.index, (data) => { this.status.panTiltStatus = data; }); this.sendCommand(v); }
    // block inquiry commands
    getLensData() { let v = command_1.ViscaCommand.inqCameraLens(this.index, (data) => { this.status.updateLensData(data); }); this.sendCommand(v); }
    getImageData() { let v = command_1.ViscaCommand.inqCameraImage(this.index, (data) => { this.status.updateImageData(data); }); this.sendCommand(v); }
}
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map
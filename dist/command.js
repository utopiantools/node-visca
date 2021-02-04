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
exports.ViscaCommand = void 0;
// import and create an alias
const constants_1 = require("./constants");
const utils = __importStar(require("./utils"));
const Parsers = __importStar(require("./parsers"));
class ViscaCommand {
    constructor({ 
    // header items
    source = 0, recipient = -1, broadcast = true, 
    // message type (QQ in the spec)
    msgType = constants_1.Constants.MSGTYPE_COMMAND, socket = 0, 
    // data might be empty
    dataType = 0, data = [], 
    // callback functions
    onComplete = null, onError = null, onAck = null, dataParser = Parsers.NoParser.parse, }) {
        // header items
        this.source = source;
        this.recipient = recipient;
        this.broadcast = broadcast;
        // message type is the QQ in the spec
        this.msgType = msgType;
        this.socket = socket;
        // data might be empty
        this.dataType = dataType;
        this.data = data;
        this.onComplete = onComplete;
        this.onError = onError;
        this.onAck = onAck;
        this.dataParser = dataParser;
        this.status = 0;
    }
    static fromPacket(packet) {
        let v = new ViscaCommand({});
        v._parsePacket(packet);
        return v;
    }
    static raw(recipient, raw) {
        let v = new ViscaCommand({ recipient });
        v._parsePacket([v.header(), ...raw, 0xff]);
        return v;
    }
    _parsePacket(packet) {
        let header = packet[0];
        this.source = (header & constants_1.Constants.HEADERMASK_SOURCE) >> 4;
        this.recipient = header & constants_1.Constants.HEADERMASK_RECIPIENT; // replies have recipient
        this.broadcast = ((header & constants_1.Constants.HEADERMASK_BROADCAST) >> 3) == 1;
        switch (packet[1]) {
            case constants_1.Constants.MSGTYPE_COMMAND:
            case constants_1.Constants.MSGTYPE_INQUIRY:
            case constants_1.Constants.MSGTYPE_ADDRESS_SET:
            case constants_1.Constants.MSGTYPE_NETCHANGE:
                this.msgType = packet[1];
                this.socket = 0;
                break;
            default:
                this.socket = packet[1] & 0b00001111;
                this.msgType = packet[1] & 0b11110000;
        }
        this.data = packet.slice(2, packet.length - 1); // might be empty, ignore terminator
        // if data is more than one byte, the first byte determines the dataType
        this.dataType = (this.data.length < 2) ? 0 : this.data.splice(0, 1)[0];
    }
    // instance methods
    header() {
        let header = 0x88;
        // recipient overrides broadcast
        if (this.recipient > -1)
            this.broadcast = false;
        if (!this.broadcast) {
            header = 0b10000000 | (this.source << 4) | (this.recipient & 0x111);
        }
        return header;
    }
    toPacket() {
        let header = this.header();
        let qq = this.msgType | this.socket;
        let rr = this.dataType;
        if (rr > 0)
            return [header, qq, rr, ...this.data, 0xff];
        else
            return [header, qq, ...this.data, 0xff];
    }
    send(transport) {
        transport.write(this);
    }
    ack() {
        this.status = constants_1.Constants.MSGTYPE_ACK;
        if (this.onAck != null)
            this.onAck();
    }
    error(err) {
        this.status = constants_1.Constants.MSGTYPE_ERROR;
        if (this.onError != null)
            this.onError(err);
    }
    // some command completions include data
    complete(data = null) {
        this.status = constants_1.Constants.MSGTYPE_COMPLETE;
        if (this.dataParser != null && data != null) {
            data = this.dataParser(data);
        }
        if (this.onComplete != null) {
            if (data == null || data.length == 0)
                this.onComplete();
            else
                this.onComplete(data);
        }
    }
    // commands for each message type
    static addressSet() {
        return new ViscaCommand({ msgType: constants_1.Constants.MSGTYPE_ADDRESS_SET, data: [1] });
    }
    static cmd(recipient = -1, dataType, data = []) {
        return new ViscaCommand({ msgType: constants_1.Constants.MSGTYPE_COMMAND, dataType, recipient, data });
    }
    static inquire(recipient = -1, dataType, data, onComplete, dataParser) {
        return new ViscaCommand({ msgType: constants_1.Constants.MSGTYPE_INQUIRY, dataType, recipient, data, dataParser, onComplete });
    }
    static cancel(recipient = -1, socket = 0) {
        return new ViscaCommand({ msgType: constants_1.Constants.MSGTYPE_CANCEL | socket, recipient });
    }
    // commands for each datatype
    static cmdInterfaceClearAll(recipient = -1) {
        return ViscaCommand.cmd(recipient, constants_1.Constants.DATATYPE_INTERFACE, [0, 1]);
    }
    static cmdCamera(recipient = -1, data = []) {
        return ViscaCommand.cmd(recipient, constants_1.Constants.DATATYPE_CAMERA, data);
    }
    static cmdOp(recipient = -1, data = []) {
        return ViscaCommand.cmd(recipient, constants_1.Constants.DATATYPE_OPERATION, data);
    }
    // inquiry commands complete with data
    static inqCamera(recipient = -1, query, onComplete, dataParser) {
        return ViscaCommand.inquire(recipient, constants_1.Constants.DATATYPE_CAMERA, query, onComplete, dataParser);
    }
    static inqOp(recipient = -1, query, onComplete, dataParser) {
        return ViscaCommand.inquire(recipient, constants_1.Constants.DATATYPE_OPERATION, query, onComplete, dataParser);
    }
    // ----------------------- Setters -------------------------------------
    // POWER ===========================
    static cmdCameraPower(device, enable = false) {
        let powerval = enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL;
        let subcmd = [constants_1.Constants.CAM_POWER, powerval];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraPowerAutoOff(device, time = 0) {
        // time = minutes without command until standby
        // 0: disable
        // 0xffff: 65535 minutes
        let subcmd = [constants_1.Constants.CAM_SLEEP_TIME, ...utils.i2v(time)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // PRESETS =========================
    // Store custom presets if the camera supports them
    // PTZOptics can store presets 0-127
    // Sony has only 0-5
    static cmdCameraPresetReset(device, preset = 0) {
        let subcmd = [constants_1.Constants.CAM_MEMORY, constants_1.Constants.DATA_RESET, preset];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraPresetSet(device, preset = 0) {
        let subcmd = [constants_1.Constants.CAM_MEMORY, constants_1.Constants.DATA_RESET, preset];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraPresetRecall(device, preset = 0) {
        let subcmd = [constants_1.Constants.CAM_MEMORY, constants_1.Constants.DATA_RESET, preset];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // PAN/TILT ===========================
    // 8x 01 06 01 VV WW XX YY FF
    // VV = x(pan) speed  1-18
    // WW = y(tilt) speed 1-17
    // XX = x mode 01 (dec), 02 (inc), 03 (stop)
    // YY = y mode 01 (dec), 02 (inc), 03 (stop)
    // x increases rightward
    // y increases downward!!
    static cmdCameraPanTilt(device, xspeed, yspeed, xmode, ymode) {
        let subcmd = [constants_1.Constants.OP_PAN_DRIVE, xspeed, yspeed, xmode, ymode];
        return ViscaCommand.cmdOp(device, subcmd);
    }
    // x and y are signed 16 bit integers, 0x0000 is center
    // range is -2^15 - 2^15 (32768)
    // relative defaults to false
    static cmdCameraPanTiltDirect(device, xspeed, yspeed, x, y, relative = false) {
        let xpos = utils.si2v(x);
        let ypos = utils.si2v(y);
        let absrel = relative ? constants_1.Constants.OP_PAN_RELATIVE : constants_1.Constants.OP_PAN_ABSOLUTE;
        let subcmd = [absrel, xspeed, yspeed, ...xpos, ...ypos];
        return ViscaCommand.cmdOp(device, subcmd);
    }
    static cmdCameraPanTiltHome(device) { return ViscaCommand.cmdOp(device, [constants_1.Constants.OP_PAN_HOME]); }
    static cmdCameraPanTiltReset(device) { return ViscaCommand.cmdOp(device, [constants_1.Constants.OP_PAN_RESET]); }
    // corner should be C.DATA_PANTILT_UR or C.DATA_PANTILT_BL
    static cmdCameraPanTiltLimitSet(device, corner, x, y) {
        let xv = utils.si2v(x);
        let yv = utils.si2v(y);
        let subcmd = [constants_1.Constants.OP_PAN_LIMIT, constants_1.Constants.DATA_RESET, corner, ...xv, ...yv];
        return ViscaCommand.cmdOp(device, subcmd);
    }
    static cmdCameraPanTiltLimitClear(device, corner) {
        let subcmd = [constants_1.Constants.OP_PAN_LIMIT, constants_1.Constants.CMD_CAM_VAL_CLEAR, corner, 0x07, 0x0F, 0x0F, 0x0F, 0x07, 0x0F, 0x0F, 0x0F];
        return ViscaCommand.cmdOp(device, subcmd);
    }
    // ZOOM ===============================
    /// offinout = 0x00, 0x02, 0x03
    /// speed = 0(low)..7(high) (-1 means default)
    static cmdCameraZoom(device, offinout = constants_1.Constants.DATA_RESET, speed = -1) {
        let data = offinout;
        if (speed > -1 && offinout != constants_1.Constants.DATA_RESET)
            data = (data << 8) + (speed & 0b111);
        let subcmd = [constants_1.Constants.CAM_ZOOM, data];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraZoomStop(device) {
        return ViscaCommand.cmdCameraZoom(device, constants_1.Constants.DATA_RESET);
    }
    /// zoom in with speed = 0..7 (-1 means default)
    static cmdCameraZoomIn(device, speed = -1) {
        return ViscaCommand.cmdCameraZoom(device, constants_1.Constants.DATA_MORE, speed);
    }
    /// zoom out with speed = 0..7 (-1 means default)
    static cmdCameraZoomOut(device, speed = -1) {
        return ViscaCommand.cmdCameraZoom(device, constants_1.Constants.DATA_LESS, speed);
    }
    /// max zoom value is 0x4000 (16384) unless digital is enabled
    /// 0xpqrs -> 0x0p 0x0q 0x0r 0x0s
    static cmdCameraZoomDirect(device, zoomval) {
        let subcmd = [constants_1.Constants.CAM_ZOOM_DIRECT, ...utils.i2v(zoomval)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // Digital Zoom enable/disable
    static cmdCameraDigitalZoom(device, enable = false) {
        let data = enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL;
        let subcmd = [constants_1.Constants.CAM_DZOOM, data];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // Focus controls
    /// stopfarnear = 0x00, 0x02, 0x03
    /// speed = 0(low)..7(high) -1 means default
    static cmdCameraFocus(device, stopfarnear = constants_1.Constants.DATA_RESET, speed = -1) {
        let data = stopfarnear;
        if (speed > -1 && stopfarnear != constants_1.Constants.DATA_RESET)
            data = (data << 8) + (speed & 0b111);
        let subcmd = [constants_1.Constants.CAM_ZOOM, data];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusStop(device) {
        return ViscaCommand.cmdCameraFocus(device, constants_1.Constants.DATA_RESET);
    }
    /// zoom in with speed = 0..7 (-1 means default)
    static cmdCameraFocusFar(device, speed = -1) {
        return ViscaCommand.cmdCameraFocus(device, constants_1.Constants.DATA_MORE, speed);
    }
    /// zoom out with speed = 0..7 (-1 means default)
    static cmdCameraFocusNear(device, speed = -1) {
        return ViscaCommand.cmdCameraFocus(device, constants_1.Constants.DATA_LESS, speed);
    }
    /// max focus value is 0xF000
    /// 0xpqrs -> 0x0p 0x0q 0x0r 0x0s
    static cmdCameraFocusDirect(device, focusval) {
        let subcmd = [constants_1.Constants.CAM_FOCUS_DIRECT, ...utils.i2v(focusval)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusAuto(device, enable = true) {
        let data = enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL;
        let subcmd = [constants_1.Constants.CAM_FOCUS_AUTO, data];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusAutoToggle(device, data) {
        let subcmd = [constants_1.Constants.CAM_FOCUS_AUTO, constants_1.Constants.DATA_TOGGLEVAL];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusTrigger(device, data) {
        let subcmd = [constants_1.Constants.CAM_FOCUS_TRIGGER, constants_1.Constants.CMD_CAM_FOCUS_TRIGGER_NOW];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusInfinity(device, data) {
        let subcmd = [constants_1.Constants.CAM_FOCUS_TRIGGER, constants_1.Constants.CMD_CAM_FOCUS_TRIGGER_INF];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusSetNearLimit(device, limit = 0xf000) {
        // limit must have low byte 0x00
        limit = limit & 0xff00;
        let subcmd = [constants_1.Constants.CAM_FOCUS_NEAR_LIMIT_POS, ...utils.i2v(limit)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusAutoSensitivity(device, high = true) {
        let data = high ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL;
        let subcmd = [constants_1.Constants.CAM_FOCUS_SENSE_HIGH, data];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    /// mode = 0 (on motion), 1 (on interval), 2 (on zoom)
    static cmdCameraFocusAutoMode(device, mode = 0) {
        let subcmd = [constants_1.Constants.CAM_FOCUS_AF_MODE, mode];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusAutoIntervalTime(device, movementTime = 0, intervalTime = 0) {
        let pqrs = (movementTime << 8) + intervalTime;
        let subcmd = [constants_1.Constants.CAM_FOCUS_AF_INTERVAL, ...utils.i2v(pqrs)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraFocusIRCorrection(device, enable = false) {
        let data = enable ? 0x00 : 0x01;
        let subcmd = [constants_1.Constants.CAM_FOCUS_IR_CORRECTION, data];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // combo zoom & focus
    static cmdCameraZoomFocus(device, zoomval = 0, focusval = 0) {
        let z = utils.i2v(zoomval);
        let f = utils.i2v(focusval);
        let subcmd = [constants_1.Constants.CAM_ZOOM_DIRECT, ...z, ...f];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // OTHER IMAGE CONTROLS
    /// white balance
    /// mode = 0(auto),1(indoor),2(outdoor),3(trigger),5(manual) 
    static cmdCameraWBMode(device, mode = 0) {
        let subcmd = [constants_1.Constants.CAM_WB_MODE, mode];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraWBTrigger(device, data) {
        let subcmd = [constants_1.Constants.CAM_WB_TRIGGER, 0x05];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // VARIOUS EXPOSURE CONTROLS
    /// mode should be 'r' for RGain, 'b' for BGain. defaults to Gain
    /// resetupdown = 0, 2, 3
    /// value must be less than 0xff;
    static cmdCameraGain(device, mode = 'r', resetupdown = 0, directvalue = -1) {
        let subcmd;
        let gaintype;
        switch (mode) {
            case 'r':
                gaintype = constants_1.Constants.CAM_RGAIN;
                break;
            case 'b':
                gaintype = constants_1.Constants.CAM_BGAIN;
                break;
            default:
                gaintype = constants_1.Constants.CAM_GAIN;
                break;
        }
        if (directvalue > 0) {
            gaintype += 0x40;
            subcmd = [gaintype, ...utils.i2v(directvalue)];
        }
        else {
            subcmd = [gaintype, resetupdown];
        }
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraGainUp(device) { let mode = ''; return ViscaCommand.cmdCameraGain(device, mode, constants_1.Constants.DATA_ONVAL); }
    static cmdCameraGainDown(device) { let mode = ''; return ViscaCommand.cmdCameraGain(device, mode, constants_1.Constants.DATA_OFFVAL); }
    static cmdCameraGainReset(device) { let mode = ''; return ViscaCommand.cmdCameraGain(device, mode, constants_1.Constants.DATA_RESET); }
    static cmdCameraGainDirect(device, value) { let mode = 'r'; return ViscaCommand.cmdCameraGain(device, mode, 0x00, value); }
    static cmdCameraGainRUp(device) { let mode = 'r'; return ViscaCommand.cmdCameraGain(device, mode, constants_1.Constants.DATA_ONVAL); }
    static cmdCameraGainRDown(device) { let mode = 'r'; return ViscaCommand.cmdCameraGain(device, mode, constants_1.Constants.DATA_OFFVAL); }
    static cmdCameraGainRReset(device) { let mode = 'r'; return ViscaCommand.cmdCameraGain(device, mode, 0x00); }
    static cmdCameraGainRDirect(device, value) { let mode = 'r'; return ViscaCommand.cmdCameraGain(device, mode, 0x00, value); }
    static cmdCameraGainBUp(device) { let mode = 'b'; return ViscaCommand.cmdCameraGain(device, mode, constants_1.Constants.DATA_ONVAL); }
    static cmdCameraGainBDown(device) { let mode = 'b'; return ViscaCommand.cmdCameraGain(device, mode, constants_1.Constants.DATA_OFFVAL); }
    static cmdCameraGainBReset(device) { let mode = 'b'; return ViscaCommand.cmdCameraGain(device, mode, 0x00); }
    static cmdCameraGainBDirect(device, value) { let mode = 'b'; return ViscaCommand.cmdCameraGain(device, mode, 0x00, value); }
    /// gain value is from 4-F
    static cmdCameraGainLimit(device, value) {
        let subcmd = [constants_1.Constants.CAM_GAIN_LIMIT, value];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // EXPOSURE =======================
    /// mode = 0, 3, A, B, D
    /// auto, manual, shutter priority, iris priority, bright
    static cmdCameraExposureMode(device, mode = 0x00) {
        let subcmd = [constants_1.Constants.CAM_EXPOSURE_MODE, mode];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraExposureCompensationEnable(device, enable = true) {
        let subcmd = [constants_1.Constants.CAM_EXP_COMP_ENABLE, enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraExposureCompensationAdjust(device, resetupdown) {
        let subcmd = [constants_1.Constants.CAM_EXP_COMP, resetupdown];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraExposureCompensationUp(device) {
        return ViscaCommand.cmdCameraExposureCompensationAdjust(device, constants_1.Constants.DATA_MORE);
    }
    static cmdCameraExposureCompensationDown(device) {
        return ViscaCommand.cmdCameraExposureCompensationAdjust(device, constants_1.Constants.DATA_LESS);
    }
    static cmdCameraExposureCompensationReset(device) {
        return ViscaCommand.cmdCameraExposureCompensationAdjust(device, constants_1.Constants.DATA_RESET);
    }
    static cmdCameraExposureCompensationDirect(device, directval = 0) {
        let subcmd = [constants_1.Constants.CAM_EXP_COMP_DIRECT, ...utils.i2v(directval)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // BACKLIGHT =======================================
    static cmdCameraBacklightCompensation(device, enable = true) {
        let subcmd = [constants_1.Constants.CAM_BACKLIGHT, enable ? 0x02 : 0x03];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // SHUTTER ========================================
    /// resetupdown = 0, 2, 3
    static cmdCameraShutter(device, resetupdown, directvalue = -1) {
        let subcmd = [constants_1.Constants.CAM_SHUTTER, resetupdown];
        if (directvalue > -1) {
            subcmd = [constants_1.Constants.CAM_SHUTTER_DIRECT, ...utils.i2v(directvalue)];
        }
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraShutterUp(device) { return ViscaCommand.cmdCameraShutter(device, constants_1.Constants.DATA_MORE); }
    static cmdCameraShutterDown(device) { return ViscaCommand.cmdCameraShutter(device, constants_1.Constants.DATA_LESS); }
    static cmdCameraShutterReset(device) { return ViscaCommand.cmdCameraShutter(device, constants_1.Constants.DATA_RESET); }
    static cmdCameraShutterDirect(device, value = 0) { return ViscaCommand.cmdCameraShutter(device, constants_1.Constants.DATA_RESET, value); }
    static cmdCameraShutterSlow(device, auto = true) {
        let subcmd = [constants_1.Constants.CAM_SHUTTER_SLOW_AUTO, auto ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    /// IRIS ======================================
    /// resetupdown = 0, 2, 3
    static cmdCameraIris(device, resetupdown, directvalue = -1) {
        let subcmd = [constants_1.Constants.CAM_IRIS, resetupdown];
        if (directvalue > -1) {
            subcmd = [constants_1.Constants.CAM_IRIS_DIRECT, ...utils.i2v(directvalue)];
        }
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraIrisUp(device) { return ViscaCommand.cmdCameraIris(device, constants_1.Constants.DATA_MORE); }
    static cmdCameraIrisDown(device) { return ViscaCommand.cmdCameraIris(device, constants_1.Constants.DATA_LESS); }
    static cmdCameraIrisReset(device) { return ViscaCommand.cmdCameraIris(device, constants_1.Constants.DATA_RESET); }
    static cmdCameraIrisDirect(device, value = 0) { return ViscaCommand.cmdCameraIris(device, constants_1.Constants.DATA_RESET, value); }
    // APERTURE =====================================
    /// resetupdown = 0, 2, 3
    static cmdCameraAperture(device, resetupdown, directvalue = -1) {
        let subcmd = [constants_1.Constants.CAM_APERTURE, resetupdown];
        if (directvalue > -1) {
            subcmd = [constants_1.Constants.CAM_APERTURE_DIRECT, ...utils.i2v(directvalue)];
        }
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraApertureUp(device) { return ViscaCommand.cmdCameraAperture(device, constants_1.Constants.DATA_MORE); }
    static cmdCameraApertureDown(device) { return ViscaCommand.cmdCameraAperture(device, constants_1.Constants.DATA_LESS); }
    static cmdCameraApertureReset(device) { return ViscaCommand.cmdCameraAperture(device, constants_1.Constants.DATA_RESET); }
    static cmdCameraApertureDirect(device, value = 0) { return ViscaCommand.cmdCameraAperture(device, constants_1.Constants.DATA_RESET, value); }
    // QUALITY ==================================
    static cmdCameraHighResMode(device, enable = true) {
        let subcmd = [constants_1.Constants.CAM_HIRES_ENABLE, enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraHighSensitivityMode(device, enable = true) {
        let subcmd = [constants_1.Constants.CAM_HIGH_SENSITIVITY, enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    /// val = 0..5
    static cmdCameraNoiseReduction(device, val) {
        let subcmd = [constants_1.Constants.CAM_NOISE_REDUCTION, val];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    /// val = 0..4
    static cmdCameraGamma(device, val) {
        let subcmd = [constants_1.Constants.CAM_GAMMA, val];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // EFFECTS ========================================
    /// effect types are enumerated in the constants file
    static cmdCameraEffect(device, effectType) {
        return ViscaCommand.cmdCamera(device, [constants_1.Constants.CAM_EFFECT, effectType]);
    }
    static cmdCameraEffectDigital(device, effectType) {
        return ViscaCommand.cmdCamera(device, [constants_1.Constants.CAM_EFFECT_DIGITAL, effectType]);
    }
    static cmdCameraEffectDigitalIntensity(device, level) {
        return ViscaCommand.cmdCamera(device, [constants_1.Constants.CAM_EFFECT_LEVEL, level]);
    }
    // basic effects
    static cmdCameraEffectOff(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_OFF);
    }
    static cmdCameraEffectPastel(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_PASTEL);
    }
    static cmdCameraEffectNegative(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_NEGATIVE);
    }
    static cmdCameraEffectSepia(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_SEPIA);
    }
    static cmdCameraEffectBW(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_BW);
    }
    static cmdCameraEffectSolar(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_SOLAR);
    }
    static cmdCameraEffectMosaic(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_MOSAIC);
    }
    static cmdCameraEffectSlim(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_SLIM);
    }
    static cmdCameraEffectStretch(device) {
        return ViscaCommand.cmdCameraEffect(device, constants_1.Constants.DATA_EFFECT_STRETCH);
    }
    // digital effects
    static cmdCameraEffectDigitalOff(device) {
        return ViscaCommand.cmdCameraEffectDigital(device, constants_1.Constants.DATA_EFFECT_OFF);
    }
    static cmdCameraEffectDigitalStill(device) {
        return ViscaCommand.cmdCameraEffectDigital(device, constants_1.Constants.DATA_EFFECT_STILL);
    }
    static cmdCameraEffectDigitalFlash(device) {
        return ViscaCommand.cmdCameraEffectDigital(device, constants_1.Constants.DATA_EFFECT_FLASH);
    }
    static cmdCameraEffectDigitalLumi(device) {
        return ViscaCommand.cmdCameraEffectDigital(device, constants_1.Constants.DATA_EFFECT_LUMI);
    }
    static cmdCameraEffectDigitalTrail(device) {
        return ViscaCommand.cmdCameraEffectDigital(device, constants_1.Constants.DATA_EFFECT_TRAIL);
    }
    // FREEZE ====================================
    static cmdCameraFreeze(device, enable = true) {
        let mode = enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL;
        let subcmd = [constants_1.Constants.CAM_FREEZE, mode];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // ICR =======================================
    static cmdCameraICR(device, enable = true) {
        let mode = enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL;
        let subcmd = [constants_1.Constants.CAM_ICR, mode];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraICRAuto(device, enable = true) {
        let mode = enable ? constants_1.Constants.DATA_ONVAL : constants_1.Constants.DATA_OFFVAL;
        let subcmd = [constants_1.Constants.CAM_AUTO_ICR, mode];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    static cmdCameraICRAutoThreshold(device, val = 0) {
        let subcmd = [constants_1.Constants.CAM_AUTO_ICR_THRESHOLD, ...utils.i2v(val)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // ID write
    static cmdCameraIDWrite(device, data) {
        let subcmd = [constants_1.Constants.CAM_ID_WRITE, ...utils.i2v(data)];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // Chroma Suppress
    // value = 0(off), 1-3
    static cmdCameraChromaSuppress(device, value) {
        let subcmd = [constants_1.Constants.CAM_CHROMA_SUPPRESS, value];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // value = 0h - Eh
    static cmdCameraColorGain(device, value) {
        let subcmd = [constants_1.Constants.CAM_COLOR_GAIN, value];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
    // value = 0h - Eh
    static cmdCameraColorHue(device, value) {
        let subcmd = [constants_1.Constants.CAM_COLOR_HUE, value];
        return ViscaCommand.cmdCamera(device, subcmd);
    }
}
exports.ViscaCommand = ViscaCommand;
// TODO:
// CAM_WIDE_D
// VIDEO_SYSTEM_SET
// IR Receive
// IR Receive Return
// Information Display
// ---------------- Inquiries ---------------------------
// [onComplete] should take the datatype returned by the parser
ViscaCommand.inqCameraPower = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_POWER], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraICRMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_ICR], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraICRAutoMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_AUTO_ICR], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraICRThreshold = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_AUTO_ICR_THRESHOLD], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraGainLimit = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_GAIN_LIMIT], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraGain = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_GAIN_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraGainR = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_RGAIN_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraGainB = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_BGAIN_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraDZoomMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_DZOOM], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraZoomPos = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_ZOOM_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraFocusAutoStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FOCUS_AUTO], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraFocusAutoMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FOCUS_AF_MODE], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraFocusIRCorrection = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FOCUS_IR_CORRECTION], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraFocusPos = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FOCUS_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraFocusNearLimit = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FOCUS_NEAR_LIMIT_POS], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraFocusAutoIntervalTime = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FOCUS_AF_INTERVAL], onComplete, Parsers.AFIntervalParser.parse);
ViscaCommand.inqCameraFocusSensitivity = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FOCUS_SENSE_HIGH], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraWBMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_WB_MODE], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraExposureMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_EXPOSURE_MODE], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraShutterSlowMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_SHUTTER_SLOW_AUTO], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraShutterPos = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_SHUTTER_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraIris = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_IRIS_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraBrightness = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_BRIGHT_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraExposureCompStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_EXP_COMP_ENABLE], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraExposureCompPosition = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_EXP_COMP_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraBacklightStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_BACKLIGHT], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraWideDMode = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_WIDE_D], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraWideDParams = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_WIDE_D_SET], onComplete, Parsers.CamWideDParamsParser.parse);
ViscaCommand.inqCameraAperture = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_APERTURE_DIRECT], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraHighResStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_HIRES_ENABLE], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraNoiseReductionStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_NOISE_REDUCTION], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraHighSensitivityStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_HIGH_SENSITIVITY], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraFreezeStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_FREEZE], onComplete, Parsers.IsOnParser.parse);
ViscaCommand.inqCameraEffect = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_EFFECT], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraEffectDigital = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_EFFECT_DIGITAL], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraEffectDigitalLevel = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_EFFECT_LEVEL], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraID = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_ID_WRITE], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraChromaSuppressStatus = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_CHROMA_SUPPRESS], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraColorGain = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_COLOR_GAIN], onComplete, Parsers.v2iParser.parse);
ViscaCommand.inqCameraColorHue = (recipient = -1, onComplete) => ViscaCommand.inqCamera(recipient, [constants_1.Constants.CAM_COLOR_HUE], onComplete, Parsers.v2iParser.parse);
// these use op commands
ViscaCommand.inqVideoFormatNow = (recipient = -1, onComplete) => ViscaCommand.inqOp(recipient, [constants_1.Constants.OP_VIDEO_FORMAT_I_NOW], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqVideoFormatNext = (recipient = -1, onComplete) => ViscaCommand.inqOp(recipient, [constants_1.Constants.OP_VIDEO_FORMAT_I_NEXT], onComplete, Parsers.ByteValParser.parse);
ViscaCommand.inqCameraPanTiltSpeed = (recipient = -1, onComplete) => ViscaCommand.inqOp(recipient, [constants_1.Constants.OP_PAN_MAX_SPEED], onComplete, Parsers.PTMaxSpeedParser.parse);
ViscaCommand.inqCameraPanTiltPos = (recipient = -1, onComplete) => ViscaCommand.inqOp(recipient, [constants_1.Constants.OP_PAN_POS], onComplete, Parsers.PTPosParser.parse);
ViscaCommand.inqCameraPanTiltStatus = (recipient = -1, onComplete) => ViscaCommand.inqOp(recipient, [constants_1.Constants.OP_PAN_STATUS], onComplete, Parsers.PTStatusParser.parse);
// block inquiry commands
ViscaCommand.inqCameraLens = (recipient = -1, onComplete) => { let c = ViscaCommand.raw(recipient, constants_1.Constants.CAM_LENS_INQUIRY); c.dataParser = Parsers.CamLensDataParser.parse; c.onComplete = onComplete; return c; };
ViscaCommand.inqCameraImage = (recipient = -1, onComplete) => { let c = ViscaCommand.raw(recipient, constants_1.Constants.CAM_IMAGE_INQUIRY); c.dataParser = Parsers.CamImageDataParser.parse; c.onComplete = onComplete; return c; };
//# sourceMappingURL=command.js.map
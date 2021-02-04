"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialBlockInquiries = exports.SpecialOpCommands = exports.ViscaError = exports.PTDirection = exports.CameraEffect = exports.DataVal = exports.CameraOpCmd = exports.CameraCmd = exports.DataType = exports.CameraMsg = exports.ControlMsg = void 0;
// enums are a special feature of typescript that
// also have reverse references
/*
enum Enum {A, B}
Enum.A === 0     // true
Enum[0] === 'A'  // true
*/
var ControlMsg;
(function (ControlMsg) {
    // == MESSAGE TYPE ==
    // controller message categories (QQ from the spec)
    ControlMsg[ControlMsg["command"] = 1] = "command";
    ControlMsg[ControlMsg["if_clear"] = 1] = "if_clear";
    ControlMsg[ControlMsg["inquiry"] = 9] = "inquiry";
    ControlMsg[ControlMsg["cancel"] = 32] = "cancel";
    ControlMsg[ControlMsg["add_set"] = 48] = "add_set";
})(ControlMsg = exports.ControlMsg || (exports.ControlMsg = {}));
var CameraMsg;
(function (CameraMsg) {
    // camera message types (QQ from the spec)
    CameraMsg[CameraMsg["netchange"] = 56] = "netchange";
    CameraMsg[CameraMsg["ack"] = 64] = "ack";
    CameraMsg[CameraMsg["complete"] = 80] = "complete";
    CameraMsg[CameraMsg["error"] = 96] = "error";
})(CameraMsg = exports.CameraMsg || (exports.CameraMsg = {}));
var DataType;
(function (DataType) {
    // == DATA TYPE ==
    // data types (RR from the spec)
    DataType[DataType["interface"] = 0] = "interface";
    DataType[DataType["camera"] = 4] = "camera";
    DataType[DataType["operation"] = 6] = "operation";
})(DataType = exports.DataType || (exports.DataType = {}));
var CameraCmd;
(function (CameraCmd) {
    // == COMMAND TYPE CONSTANTS ==
    // camera settings codes                // data (pqrs is in i2v format)
    CameraCmd[CameraCmd["power"] = 0] = "power";
    CameraCmd[CameraCmd["sleep_time"] = 64] = "sleep_time";
    CameraCmd[CameraCmd["icr"] = 1] = "icr";
    CameraCmd[CameraCmd["icr_auto"] = 81] = "icr_auto";
    CameraCmd[CameraCmd["icr_threshold"] = 33] = "icr_threshold";
    CameraCmd[CameraCmd["gain"] = 12] = "gain";
    CameraCmd[CameraCmd["gain_limit"] = 44] = "gain_limit";
    CameraCmd[CameraCmd["gain_direct"] = 76] = "gain_direct";
    CameraCmd[CameraCmd["rgain"] = 3] = "rgain";
    CameraCmd[CameraCmd["rgain_direct"] = 67] = "rgain_direct";
    CameraCmd[CameraCmd["bgain"] = 4] = "bgain";
    CameraCmd[CameraCmd["bgain_direct"] = 68] = "bgain_direct";
    CameraCmd[CameraCmd["zoom"] = 7] = "zoom";
    CameraCmd[CameraCmd["dzoom"] = 6] = "dzoom";
    CameraCmd[CameraCmd["zoom_direct"] = 71] = "zoom_direct";
    CameraCmd[CameraCmd["focus"] = 8] = "focus";
    CameraCmd[CameraCmd["focus_ir_correction"] = 17] = "focus_ir_correction";
    CameraCmd[CameraCmd["focus_trigger"] = 24] = "focus_trigger";
    CameraCmd[CameraCmd["focus_near_limit"] = 40] = "focus_near_limit";
    CameraCmd[CameraCmd["focus_mode"] = 56] = "focus_mode";
    CameraCmd[CameraCmd["focus_direct"] = 72] = "focus_direct";
    CameraCmd[CameraCmd["focus_af_mode"] = 87] = "focus_af_mode";
    CameraCmd[CameraCmd["focus_af_interval"] = 39] = "focus_af_interval";
    CameraCmd[CameraCmd["focus_high_sensitivity"] = 88] = "focus_high_sensitivity";
    CameraCmd[CameraCmd["wb_mode"] = 53] = "wb_mode";
    CameraCmd[CameraCmd["wb_trigger"] = 16] = "wb_trigger";
    CameraCmd[CameraCmd["exposure_mode"] = 57] = "exposure_mode";
    CameraCmd[CameraCmd["shutter_mode"] = 90] = "shutter_mode";
    CameraCmd[CameraCmd["shutter"] = 10] = "shutter";
    CameraCmd[CameraCmd["shutter_direct"] = 74] = "shutter_direct";
    CameraCmd[CameraCmd["iris"] = 11] = "iris";
    CameraCmd[CameraCmd["iris_direct"] = 75] = "iris_direct";
    CameraCmd[CameraCmd["brightness"] = 13] = "brightness";
    CameraCmd[CameraCmd["brightness_direct"] = 77] = "brightness_direct";
    CameraCmd[CameraCmd["exposure_comp"] = 14] = "exposure_comp";
    CameraCmd[CameraCmd["exposure_comp_active"] = 62] = "exposure_comp_active";
    CameraCmd[CameraCmd["exposure_comp_direct"] = 78] = "exposure_comp_direct";
    CameraCmd[CameraCmd["backlight"] = 51] = "backlight";
    CameraCmd[CameraCmd["wide_dynamic"] = 61] = "wide_dynamic";
    CameraCmd[CameraCmd["wide_dynamic_refresh"] = 16] = "wide_dynamic_refresh";
    CameraCmd[CameraCmd["wide_dynamic_direct"] = 45] = "wide_dynamic_direct";
    // wide dynamic range settings
    // p: Screen display (0: Combined image, 2: Long-time, 3: Short-time)
    // q: Detection sensitivity (0: L 1: M 2: H)
    // r: Blocked-up shadow correction level (0: L 1: M 2: H 3: S)
    // s: Blown-out highlight correction level (0: L 1: M 2: H)
    // tu: Exposure ratio of short exposure (x1 to x64)
    CameraCmd[CameraCmd["aperture"] = 2] = "aperture";
    CameraCmd[CameraCmd["aperture_direct"] = 66] = "aperture_direct";
    CameraCmd[CameraCmd["hires_enable"] = 82] = "hires_enable";
    CameraCmd[CameraCmd["noise_reduction"] = 83] = "noise_reduction";
    CameraCmd[CameraCmd["gamma"] = 91] = "gamma";
    CameraCmd[CameraCmd["high_sensitivity"] = 94] = "high_sensitivity";
    // freeze = 0x62,            // (can inquire) not supported by sony
    CameraCmd[CameraCmd["effect"] = 99] = "effect";
    CameraCmd[CameraCmd["effect_digital"] = 100] = "effect_digital";
    CameraCmd[CameraCmd["effect_level"] = 101] = "effect_level";
    CameraCmd[CameraCmd["chroma_suppress"] = 95] = "chroma_suppress";
    CameraCmd[CameraCmd["color_gain"] = 73] = "color_gain";
    CameraCmd[CameraCmd["color_hue"] = 79] = "color_hue";
    // misc other commands
    CameraCmd[CameraCmd["memory"] = 63] = "memory";
    CameraCmd[CameraCmd["id_set"] = 34] = "id_set";
})(CameraCmd = exports.CameraCmd || (exports.CameraCmd = {}));
var CameraOpCmd;
(function (CameraOpCmd) {
    // pan-tilt commands
    // in all PT commands, the following variables apply
    // VV: pan speed / sony 01-18
    // WW: tilt speed / sony 01-17
    // YYYY: pan 4 bit signed value from E1E5 - 1E1B
    // ZZZZ: tilt 4 bit signed from FC75 to 0FF0 (flip off) or F010 to 038B (flip on)
    CameraOpCmd[CameraOpCmd["pt_home"] = 4] = "pt_home";
    CameraOpCmd[CameraOpCmd["pt_reset"] = 5] = "pt_reset";
    CameraOpCmd[CameraOpCmd["pt_move"] = 1] = "pt_move";
    // p: pan move 1-left, 2-right, 3-none
    // q: tilt move 1-up, 2-down, 3-none
    CameraOpCmd[CameraOpCmd["pt_direct"] = 2] = "pt_direct";
    CameraOpCmd[CameraOpCmd["pt_relative"] = 3] = "pt_relative";
    CameraOpCmd[CameraOpCmd["pt_limit"] = 7] = "pt_limit";
    // to set:   00 0W 0Y 0Y 0Y 0Y 0Z 0Z 0Z 0Z
    // YYYY: pan 4 bit signed value from E1E5 - 1E1B
    // ZZZZ: tilt 4 bit signed from FC75 to 0FF0 (flip off) or F010 to 038B (flip on)
    // W: 1 addresses the up-right limit (values must be positive)
    // W: 0 addresses the down-left limit (values must be negative)
    // to clear: 01 0W 07 0F 0F 0F 07 0F 0F 0F
    // inquiries only
    CameraOpCmd[CameraOpCmd["pt_max_speed_inq"] = 17] = "pt_max_speed_inq";
    CameraOpCmd[CameraOpCmd["pt_pos_inq"] = 18] = "pt_pos_inq";
    CameraOpCmd[CameraOpCmd["pt_status_inq"] = 16] = "pt_status_inq";
    // general operational settings
    CameraOpCmd[CameraOpCmd["menu_screen"] = 6] = "menu_screen";
    CameraOpCmd[CameraOpCmd["video_format"] = 53] = "video_format";
    CameraOpCmd[CameraOpCmd["video_format_now_inq"] = 35] = "video_format_now_inq";
    CameraOpCmd[CameraOpCmd["video_format_next_inq"] = 51] = "video_format_next_inq";
    // These codes are camera specific. Sony camera codes are as follows here
    // p:
    // 0 = 1080i59.94, 1 = 1080p29.97, 2 = 720p59.94, 3 = 720p29.97, 4 = NTSC (not all cameras)
    // 8 = 1080i50,    9 = 720p50,     A = 720p25,    B = 1080i50,   C = PAL (some cameras)
    // (I wonder if the manual intended to say B = 1080p50 ?)
    // video system changes require a power cycle
    CameraOpCmd[CameraOpCmd["ir_receiver_on"] = 8] = "ir_receiver_on";
})(CameraOpCmd = exports.CameraOpCmd || (exports.CameraOpCmd = {}));
var DataVal;
(function (DataVal) {
    // == COMMAND ONLY CONSTANTS ==
    // command constants (not available on inquiries)
    // super generic constants
    DataVal[DataVal["stop"] = 0] = "stop";
    DataVal[DataVal["reset"] = 0] = "reset";
    DataVal[DataVal["clear"] = 1] = "clear";
    DataVal[DataVal["more"] = 2] = "more";
    DataVal[DataVal["less"] = 3] = "less";
    // greater specificity
    DataVal[DataVal["value_reset"] = 0] = "value_reset";
    DataVal[DataVal["value_clear"] = 1] = "value_clear";
    DataVal[DataVal["value_up"] = 2] = "value_up";
    DataVal[DataVal["value_down"] = 3] = "value_down";
    DataVal[DataVal["zoom_stop"] = 0] = "zoom_stop";
    DataVal[DataVal["zoom_tele"] = 2] = "zoom_tele";
    DataVal[DataVal["zoom_wide"] = 3] = "zoom_wide";
    DataVal[DataVal["zoom_tele_variable"] = 32] = "zoom_tele_variable";
    DataVal[DataVal["zoom_wide_variable"] = 48] = "zoom_wide_variable";
    DataVal[DataVal["focus_stop"] = 0] = "focus_stop";
    DataVal[DataVal["focus_far"] = 2] = "focus_far";
    DataVal[DataVal["focus_near"] = 3] = "focus_near";
    DataVal[DataVal["focus_far_variable"] = 32] = "focus_far_variable";
    DataVal[DataVal["focus_near_variable"] = 48] = "focus_near_variable";
    DataVal[DataVal["focus_trigger_now"] = 1] = "focus_trigger_now";
    DataVal[DataVal["focus_trigger_inf"] = 2] = "focus_trigger_inf";
    DataVal[DataVal["wb_trigger_now"] = 5] = "wb_trigger_now";
    // == OTHER DATA CONSTANTS ==
    DataVal[DataVal["on"] = 2] = "on";
    DataVal[DataVal["off"] = 3] = "off";
    DataVal[DataVal["toggle"] = 16] = "toggle";
    DataVal[DataVal["irc_enabled"] = 1] = "irc_enabled";
    DataVal[DataVal["focus_mode_auto"] = 2] = "focus_mode_auto";
    DataVal[DataVal["focus_mod_manual"] = 3] = "focus_mod_manual";
    DataVal[DataVal["focus_mode_toggle"] = 16] = "focus_mode_toggle";
    DataVal[DataVal["autofocus_on_movement"] = 0] = "autofocus_on_movement";
    DataVal[DataVal["autofocus_on_interval"] = 1] = "autofocus_on_interval";
    DataVal[DataVal["autofocus_on_zoom"] = 2] = "autofocus_on_zoom";
    DataVal[DataVal["wb_auto"] = 0] = "wb_auto";
    DataVal[DataVal["wb_indoor"] = 1] = "wb_indoor";
    DataVal[DataVal["wb_outdoor"] = 2] = "wb_outdoor";
    DataVal[DataVal["wb_trigger"] = 3] = "wb_trigger";
    DataVal[DataVal["wb_manual"] = 4] = "wb_manual";
    DataVal[DataVal["exposure_auto"] = 0] = "exposure_auto";
    DataVal[DataVal["exposure_manual"] = 3] = "exposure_manual";
    DataVal[DataVal["exposure_shutter"] = 10] = "exposure_shutter";
    DataVal[DataVal["exposure_iris"] = 11] = "exposure_iris";
    DataVal[DataVal["exposure_bright"] = 13] = "exposure_bright";
    DataVal[DataVal["wide_dynamic_auto"] = 0] = "wide_dynamic_auto";
    DataVal[DataVal["wide_dynamic_ratio"] = 1] = "wide_dynamic_ratio";
    DataVal[DataVal["wide_dynamic_on"] = 2] = "wide_dynamic_on";
    DataVal[DataVal["wide_dynamic_off"] = 3] = "wide_dynamic_off";
    DataVal[DataVal["wide_dynamic_histogram"] = 4] = "wide_dynamic_histogram";
})(DataVal = exports.DataVal || (exports.DataVal = {}));
var CameraEffect;
(function (CameraEffect) {
    // basic effects
    CameraEffect[CameraEffect["off"] = 0] = "off";
    CameraEffect[CameraEffect["pastel"] = 1] = "pastel";
    CameraEffect[CameraEffect["negative"] = 2] = "negative";
    CameraEffect[CameraEffect["sepia"] = 3] = "sepia";
    CameraEffect[CameraEffect["bw"] = 4] = "bw";
    CameraEffect[CameraEffect["solar"] = 5] = "solar";
    CameraEffect[CameraEffect["mosaic"] = 6] = "mosaic";
    CameraEffect[CameraEffect["slim"] = 7] = "slim";
    CameraEffect[CameraEffect["stretch"] = 8] = "stretch";
    // digital effects
    CameraEffect[CameraEffect["d_still"] = 1] = "d_still";
    CameraEffect[CameraEffect["d_flash"] = 2] = "d_flash";
    CameraEffect[CameraEffect["d_lumi"] = 3] = "d_lumi";
    CameraEffect[CameraEffect["d_trail"] = 4] = "d_trail";
})(CameraEffect = exports.CameraEffect || (exports.CameraEffect = {}));
var PTDirection;
(function (PTDirection) {
    PTDirection[PTDirection["stop"] = 0] = "stop";
    PTDirection[PTDirection["left"] = 1] = "left";
    PTDirection[PTDirection["right"] = 2] = "right";
    PTDirection[PTDirection["up"] = 1] = "up";
    PTDirection[PTDirection["down"] = 2] = "down";
    PTDirection[PTDirection["corner_ur"] = 1] = "corner_ur";
    PTDirection[PTDirection["corner_dl"] = 0] = "corner_dl";
})(PTDirection = exports.PTDirection || (exports.PTDirection = {}));
var ViscaError;
(function (ViscaError) {
    // error codes
    ViscaError[ViscaError["syntax"] = 2] = "syntax";
    ViscaError[ViscaError["buffer_full"] = 3] = "buffer_full";
    ViscaError[ViscaError["cancelled"] = 4] = "cancelled";
    ViscaError[ViscaError["invalid_buffer"] = 5] = "invalid_buffer";
    ViscaError[ViscaError["command_failed"] = 65] = "command_failed";
})(ViscaError = exports.ViscaError || (exports.ViscaError = {}));
exports.SpecialOpCommands = {
    // special system commands (still need header and terminator)
    ir_return_on: [0x01, 0x7D, 0x01, 0x03, 0x00, 0x00],
    ir_return_off: [0x01, 0x7D, 0x01, 0x13, 0x00, 0x00],
    info_display_on: [0x01, 0x7E, 0x01, 0x18, 0x02],
    info_display_off: [0x01, 0x7E, 0x01, 0x18, 0x03],
    // special inquiry commands
    ir_condition_inq: [0x09, 0x06, 0x34],
    info_display_on_inq: [0x09, 0x7e, 0x01, 0x18],
    fan_condition_inq: [0x09, 0x7e, 0x01, 0x38],
};
exports.SpecialBlockInquiries = {
    system_version: [0x09, 0x00, 0x02],
    //mnq: model code
    //rstu: rom version
    //vw: socket number
    // block inquiries
    camera_lens_inq: [0x09, 0x7E, 0x7E, 0x00],
    // 0w 0w 0w 0w 0v 0v 0y 0y 0y 0y 00 WW VV
    // w: zoom position
    // v: focus near limit
    // y: focus position
    // WW:
    //     bit 0 indicates autofocus status, 
    //     bit 1 indicates digital zoom status
    //     bit 2 indicates AF sensitivity / 0-slow 1-normal
    //     bits 3-4 indicate AF mode / 0-normal, 1-interval, 2-zoom trigger
    // VV:
    //     bit 0 indicates zooming status / 0-stopped, 1-executing
    //     bit 1 indicates focusing status
    //     bit 2 indicates camera memory recall status / 0-stopped, 1-executing
    //     bit 3 indicates low contrast detection
    camera_image_inq: [0x09, 0x7E, 0x7E, 0x01],
};
//# sourceMappingURL=enums.js.map
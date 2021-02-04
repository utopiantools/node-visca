"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialTransport = void 0;
// import {SerialPort} from "serialport"
const events_1 = require("events");
const uuid_1 = require("uuid");
const SerialPort = require("../../node_modules/@types/serialport");
const command_1 = require("./command");
const Delimiter = require('@serialport/parser-delimiter');
// simply implements a visca transport over the serial interface
class SerialTransport extends events_1.EventEmitter {
    constructor(portname = "/dev/ttyUSB0", timeout = 1, baudRate = 9600, debug = false) {
        super();
        this.portname = portname;
        this.timeout = timeout;
        this.baudRate = baudRate;
        this.debug = debug;
        this.started = false;
        if (this.started)
            return;
        this.uuid = uuid_1.v4();
        this.start();
    }
    start() {
        if (this.started)
            return;
        // open the serial port
        try {
            this.serialport = new SerialPort(this.portname, { baudRate: this.baudRate });
            this.serialport.on('open', this.onOpen); // provides error object
            this.serialport.on('close', this.onClose); // if disconnected, err.disconnected == true
            this.serialport.on('error', this.onError); // provides error object
            this.serialport.pipe(new Delimiter({ delimiter: [0xff] }))
                .on('data', this.onData); // provides a Buffer object
        }
        catch (e) {
            console.log(`Exception opening serial port '${this.portname}' for (display) ${e}\n`);
        }
    }
    restart() { this.close(); this.start(); }
    close() { this.serialport.close(); this.started = false; }
    onOpen() { this.started = true; this.emit('open'); }
    onClose(e) { console.log(e); this.started = false; this.emit('close'); }
    onError(e) { console.log(e); this.started = false; this.emit('error', e); }
    onData(packet) {
        // the socket parser gives us only full visca packets
        // (terminated with 0xff)
        console.log('Received: ', packet);
        if (this.debug)
            console.log('Received: ' + packet);
        // convert to command packet object
        let v = command_1.ViscaCommand.fromPacket([...packet]);
        this.emit('data', v);
    }
    write(viscaCommand) {
        if (!this.serialport.isOpen)
            return;
        let packet = viscaCommand.toPacket();
        this.serialport.write(packet);
        if (this.debug)
            console.log('Sent: ' + packet);
    }
}
exports.SerialTransport = SerialTransport;
//# sourceMappingURL=visca-serial.js.map
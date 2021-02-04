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
exports.UDPTransport = exports.ViscaServer = void 0;
const udp = __importStar(require("dgram"));
const events_1 = require("events");
const uuid_1 = require("uuid");
const command_1 = require("./command");
class ViscaServer extends events_1.EventEmitter {
    constructor(port = 50000) {
        super();
        this.port = port;
        this.uuid = uuid_1.v4();
    }
    open() {
        // creating a udp server
        let socket = udp.createSocket('udp4');
        // emits when any error occurs
        socket.on('error', function (error) {
            console.log('Error: ' + error);
            socket.close();
        });
        // emits on new datagram msg
        socket.on('message', function (msg, info) {
            console.log('Data received from client : ' + msg.toString());
            console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
            // emit message up the chain
            // this.emit('message', msg);
            this.emit('data', command_1.ViscaCommand.fromPacket([...msg]));
        });
        //emits when socket is ready and listening for datagram msgs
        socket.on('listening', function () {
            let address = socket.address();
            let port = address.port;
            let family = address.family;
            let ipaddr = address.address;
            console.log('Server is listening at port' + port);
            console.log('Server ip :' + ipaddr);
            console.log('Server is IP4/IP6 : ' + family);
        });
        //emits after the socket is closed using socket.close();
        socket.on('close', function () {
            console.log('Socket is closed !');
        });
        socket.bind(this.port);
        this.socket = socket;
    }
    close() {
        this.socket.close();
    }
    write(cmd) {
        this.socket.send(cmd.toPacket());
    }
}
exports.ViscaServer = ViscaServer;
// simply implements a visca transport over a udp socket
class UDPTransport extends events_1.EventEmitter {
    constructor(host = '', port = -1) {
        super();
        this.host = host;
        this.port = port;
        this.debug = false;
        this.host = host;
        this.uuid = uuid_1.v4();
        this.open();
    }
    open() {
        // creating a client socket
        this.socket = udp.createSocket('udp4');
        // handle replies
        this.socket.on('message', function (msg, info) {
            console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
            this.onData([...msg]);
        });
    }
    onData(packet) {
        console.log('Received: ', packet);
        if (this.debug)
            console.log('Received: ' + packet);
        let v = command_1.ViscaCommand.fromPacket(packet);
        this.emit('data', { uuid: this.uuid, viscaCommand: v }); // this is UDPData
    }
    write(viscaCommand) {
        if (this.socket == null)
            this.open();
        let packet = viscaCommand.toPacket();
        if (this.debug)
            console.log('Sent: ' + packet);
        // sending packet
        this.socket.send(packet, this.port, this.host, function (error) {
            if (error) {
                this.socket.close();
            }
            else {
                console.log('Data sent !!!');
            }
        });
    }
}
exports.UDPTransport = UDPTransport;
//# sourceMappingURL=visca-ip.js.map
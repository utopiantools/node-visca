import { EventEmitter } from 'events'

import { Constants as C } from './constants'
import { ViscaCommand } from "./command"
import { Camera } from "./camera"
import { SerialTransport } from './visca-serial'
import { UDPData, UDPTransport, ViscaServer } from "./visca-ip"

// VISCA cameras are identified by an id which in hard-wired cameras is counted
// upward from the first camera in the chain being #1. IP cameras are accessed
// directly with their IP address and therefore always have an id of 1.
//
// [name] is a user-readable name for the camera.
export interface ViscaCameraConfig {
	name: string,
	id: number,
	ip: string,
	port: number,
}


export interface ViscaControllerConfig {
	// serial port details for talking to visca cameras
	viscaSerial: {
		port: string,   // 'COM8' or /dev/ttyUSB0 etc
		baud: number,   // usually 9600 or 38400
	},

	// configuration for the visca ip translation server
	// the http server will reside at the basePort
	// udp servers will exist at basePort + cameraIndex
	viscaServer: {
		basePort: number,
	},
}

// the controller keeps track of the cameras connected by serial
// it also communicates with cameras over IP
// and it exposes a UDP server for each serially connected camera
export class ViscaController extends EventEmitter {
	serialConnection: SerialTransport;
	ipServers: ViscaServer[] = [];
	serialBroadcastCommands: ViscaCommand[] = []; // FIFO stack of serial commands sent
	cameras: {[index:string]: Camera} = {};       // will be indexed with uuid strings for ip cameras
	cameraCount = 0;

	constructor(public config: ViscaControllerConfig) {
		super();
	}

	init() {
		this.cameras = {};
		this.cameraCount = 0;
	}

	// uuid will be generated when the data comes from an IP camera
	addIPCamera(c: ViscaCameraConfig) : Camera {
		let transport = new UDPTransport(c.ip, c.port);
		transport.on('data', ({uuid, viscaCommand}) => this.onUDPData({uuid, viscaCommand}));

		let camera = new Camera(1, transport, c.name); // IP cameras all have index 1
		this.cameras[transport.uuid] = camera;

		camera.sendCommand(ViscaCommand.cmdInterfaceClearAll(1));
		camera.inquireAll();
		return camera;
	}


	// manage the serial transport
	restartSerial() { this.closeSerial(); this.init(); this.startSerial(); }
	closeSerial() { this.serialConnection.close(); }
	startSerial(portname = "/dev/ttyUSB0", baudRate = 9600, timeout = 1, debug = false) {
		this.serialConnection = new SerialTransport(portname, timeout, baudRate, debug);
		this.serialConnection.start();

		// create callbacks
		this.serialConnection.on('open', this.onSerialOpen);
		this.serialConnection.on('close', this.onSerialClose);
		this.serialConnection.on('error', this.onSerialError);
		this.serialConnection.on('data', this.onSerialData);

		// send enumeration command (on reply, we will send the IF clear command)
		this.enumerateSerial();
	}

	onSerialOpen() { }
	onSerialClose() { }
	onSerialError(e:string) { console.log(e); }
	onSerialData(viscaCommand:ViscaCommand) {
		let v = viscaCommand;

		// make sure we have this camera as an object if it came from a camera
		// but leave the camera null if it was a broadcast command

		let camera = null;
		if (v.source != 0) {
			if (!(v.source in this.cameras)) {
				camera = new Camera(v.source, this.serialConnection);
				camera.uuid = v.source.toString();
				this.cameras[v.source] = camera;
			} else {
				camera = this.cameras[v.source];
			}
		}

		if (camera != null) {
			return this.onCameraData(camera, v);
		}

		// the following commands are 'passthrough' commands that
		// go through the whole serial chain as broadcast commands
		switch (v.msgType) {
			case C.MSGTYPE_IF_CLEAR:
				// reset data for all serial port cameras
				for (let cam of Object.values(this.cameras)) {
					if (cam.uuid == cam.index.toString()) cam._clear();
				}
				this.inquireAllSerial();
				break;

			// address set message, reset all serial port cameras
			case C.MSGTYPE_ADDRESS_SET:
				let highestIndex = v.data[0] - 1;
				for (let i = 1; i <= highestIndex; i++) this.cameras[i] = new Camera(i, this.serialConnection);
				for (let i = highestIndex + 1; i < 8; i++) delete (this.cameras[i]);
				this.ifClearAllSerial();
				this.setupIPProxies();
				break;

			default:
				break;
		}
		this.emit('update');
	}

	onUDPData({ uuid, viscaCommand }:UDPData) {
		let camera = this.cameras[uuid];
		return this.onCameraData(camera, viscaCommand);
	}

	onCameraData(camera:Camera, v:ViscaCommand) {
		switch (v.msgType) {
			case C.MSGTYPE_IF_CLEAR:
				camera._clear();
				break;

			// network change messages are unprompted
			case C.MSGTYPE_NETCHANGE:
				// a camera issues this when it detects a change on the serial line,
				// and if we get it, we should re-assign all serial port cameras.
				this.enumerateSerial();
				break;

			// ack message, one of our commands was accepted and put in a buffer
			case C.MSGTYPE_ACK:
				camera.ack(v);
				return;

			// completion message
			case C.MSGTYPE_COMPLETE:
				camera.complete(v);
				break;

			// error messages
			case C.MSGTYPE_ERROR:
				camera.error(v);
				break;

			default:
				break;
		}
		this.emit('update');
	}

	sendSerial(viscaCommand:ViscaCommand) {
		this.serialConnection.write(viscaCommand);
	}

	// forces a command to be a broadcast command (only applies to serial)
	broadcastSerial(viscaCommand:ViscaCommand) {
		viscaCommand.broadcast = true;
		this.serialConnection.write(viscaCommand);
	}

	// forces a command to go to a specific camera
	sendToCamera(camera:Camera, viscaCommand:ViscaCommand) {
		camera.sendCommand(viscaCommand);
	}

	// system-level commands... only relevant to serial connections
	enumerateSerial() {
		this.sendSerial(ViscaCommand.addressSet());
	}

	ifClearAllSerial() {
		this.sendSerial(ViscaCommand.cmdInterfaceClearAll());
	}

	// for each camera queue all the inquiry commands
	// to get a full set of camera status data
	inquireAllSerial() {
		for (let camera of Object.values(this.cameras)) {
			if (camera.transport == this.serialConnection) {
				camera.inquireAll();
			}
		}
	}

	inquireAllIP() {
		for (let camera of Object.values(this.cameras)) {
			if (camera.transport.uuid) {
				camera.inquireAll();
			}
		}
	}

	inquireAll() { this.inquireAllSerial(); this.inquireAllIP(); }

	setupIPProxies() {
		for (let server of this.ipServers) server.close();
		this.ipServers = [];
		for (let camera of Object.values(this.cameras)) {
			if (camera.transport.uuid) continue;

			let port = this.config.viscaServer.basePort + camera.index;
			let server = new ViscaServer(port);
			server.on('data', (viscaCommand: ViscaCommand) => {
				this.onCameraData(camera, viscaCommand);
			});
			this.ipServers.push(server);
		}
	}

	// for debugging
	dump(packet:number[], title:string = null) {
		if (!packet || packet.length == 0) return;

		let header = packet[0];
		let term = packet[packet.length - 2]; // last item
		let qq = packet[1];

		let sender = (header & 0b01110000) >> 4;
		let broadcast = (header & 0b1000) >> 3;
		let recipient = header & 0b0111;
		let recipient_s;

		if (broadcast) recipient_s = "*";
		else recipient_s = recipient.toString();

		console.log("-----");

		if (title) console.log(`packet (${title}) [${sender} => ${recipient_s}] len=${packet.length}: ${packet}`);
		else console.log(`packet [${sender} => ${recipient_s}] len=${packet.length}: ${packet}`);

		console.log(` QQ.........: ${qq}`);

		if (qq == 0x01) console.log("              (Command)");
		if (qq == 0x09) console.log("              (Inquiry)");

		if (packet.length > 3) {
			let rr = packet[2];
			console.log(` RR.........: ${rr}`);

			if (rr == 0x00) console.log("              (Interface)");
			if (rr == 0x04) console.log("              (Camera [1])");
			if (rr == 0x06) console.log("              (Pan/Tilter)");
		}
		if (packet.length > 4) {
			let data = packet.slice(3);
			console.log(` Data.......: ${data}`);
		} else console.log(" Data.......: null");

		if (term !== 0xff) {
			console.log("ERROR: Packet not terminated correctly");
			return;
		}
		if (packet.length == 3 && (qq & 0b11110000) >> 4 == 4) {
			let socketno = qq & 0b1111;
			console.log(` packet: ACK for socket ${socketno}`);
		}

		if (packet.length == 3 && (qq & 0b11110000) >> 4 == 5) {
			let socketno = qq & 0b1111;
			console.log(` packet: COMPLETION for socket ${socketno}`);
		}

		if (packet.length > 3 && (qq & 0b11110000) >> 4 == 5) {
			let socketno = qq & 0b1111;
			let ret = packet.slice(2);
			console.log(` packet: COMPLETION for socket ${socketno}, data=${ret}`);
		}

		if (packet.length == 4 && (qq & 0b11110000) >> 4 == 6) {
			console.log(" packet: ERROR!");

			let socketno = qq & 0b00001111;
			let errcode = packet[2];

			//these two are special, socket is zero && has no meaning:
			if (errcode == 0x02 && socketno == 0) console.log("        : Syntax Error");
			if (errcode == 0x03 && socketno == 0) console.log("        : Command Buffer Full");

			if (errcode == 0x04) console.log(`        : Socket ${socketno}: Command canceled`);

			if (errcode == 0x05) console.log(`        : Socket ${socketno}: Invalid socket selected`);

			if (errcode == 0x41) console.log(`        : Socket ${socketno}: Command not executable`);
		}

		if (packet.length == 3 && qq == 0x38) console.log("Network Change - we should immediately issue a renumbering!");
	}
}

import * as udp from 'dgram'
import * as net from 'net'
import { EventEmitter } from 'events'
import { v4 as uuid } from 'uuid'
import { ViscaTransport } from './transport'
import { ViscaCommand } from './command'

/*
Creates a UDP server to receive VISCA over IP commands.

This can be used to route IP commands to cameras connected by Serial
and to send camera replies back to the proper UDP clients.

The Visca Controller should create one Server for each physical camera we want
to expose to network control.
*/

export interface UDPData {
	uuid: string,
	viscaCommand: ViscaCommand,
}

export class ViscaServer extends EventEmitter implements ViscaTransport {

	public uuid: string;
	public socket: udp.Socket;

	constructor( public port = 50000 ) {
		super();

		this.uuid = uuid();
	}

	open() {
		// creating a udp server
		let socket = udp.createSocket( 'udp4' );

		// emits when any error occurs
		socket.on( 'error', function ( error ) {
			console.log( 'Error: ' + error );
			socket.close();
		} );

		// emits on new datagram msg
		socket.on( 'message', function ( msg, info ) {
			console.log( 'Data received from client : ' + msg.toString() );
			console.log( 'Received %d bytes from %s:%d\n', msg.length, info.address, info.port );

			// emit message up the chain
			// this.emit('message', msg);
			this.emit( 'data', ViscaCommand.fromPacket( [...msg] ) );
		} );

		//emits when socket is ready and listening for datagram msgs
		socket.on( 'listening', function () {
			let address = socket.address();
			let port = address.port;
			let family = address.family;
			let ipaddr = address.address;
			console.log( 'Server is listening at port' + port );
			console.log( 'Server ip :' + ipaddr );
			console.log( 'Server is IP4/IP6 : ' + family );
		} );

		//emits after the socket is closed using socket.close();
		socket.on( 'close', function () {
			console.log( 'Socket is closed !' );
		} );

		socket.bind( this.port );
		this.socket = socket;
	}

	close() {
		this.socket.close();
	}

	write( cmd: ViscaCommand ) {
		this.socket.send( cmd.toPacket() );
	}
}

// simply implements a visca transport over a udp socket
export class UDPTransport extends EventEmitter {
	debug = false;
	uuid: string;
	socket: udp.Socket;

	constructor( public host:string  = '', public port = -1 ) {
		super();

		this.host = host;
		this.uuid = uuid();
		this.open();
	}

	open() {
		// creating a client socket
		this.socket = udp.createSocket( 'udp4' );

		// handle replies
		this.socket.on( 'message', ( msg, info ) =>{
			console.log( 'Data received from client : ' + msg.toString() );
			console.log( 'Received %d bytes from %s:%d\n', msg.length, info.address, info.port );
			this.onData( [...msg] );
		} );
		this.socket.on("error", (e) => {
			this.emit("error", e);
		});
	}

	onData( packet:number[] ) {
		console.log( 'Received: ', packet);
		let v = ViscaCommand.fromPacket( packet );
		console.log( 'PARSED VISCA COMMAND: ', v.toString());

		this.emit( 'data', { uuid: this.uuid, viscaCommand: v } ); // this is UDPData
	}

	write( viscaCommand:ViscaCommand ) {
		if (this.socket == null) this.open();

		let packet = Buffer.from(viscaCommand.toPacket());
		if ( this.debug ) console.log( 'Sent: ' + packet );

		// sending packet
		this.socket.send( packet, this.port, this.host, ( error ) => {
			if ( error ) {
				this.socket.close();
			} else if (this.debug) {
				console.log( 'Data sent !!!' );
			}
		} );
	}
}


// simply implements a visca transport over a tcp socket
export class TCPTransport extends EventEmitter {
	debug = false;
	uuid: string;
	socket: net.Socket;

	constructor( public host:string  = '', public port = -1 ) {
		super();

		this.host = host;
		this.uuid = uuid();
		this.open();
	}

	open() {
		// creating a client socket
		this.socket = new net.Socket();
		this.socket.connect(this.port, this.host);
		// handle replies
		this.socket.on( 'data', function ( msg ) {
			console.log( 'Received %d bytes from %s:%d\n', msg.length );
			this.onData( [...msg] );
		});
		this.socket.on("error", (e) => {
			this.emit("error", e);
		});
	}

	onData( packet:number[] ) {
		console.log( 'Received: ', packet );
		if ( this.debug ) console.log( 'Received: ' + packet );
		let v = ViscaCommand.fromPacket( packet );

		this.emit( 'data', { uuid: this.uuid, viscaCommand: v } ); // this is UDPData
	}

	write( viscaCommand:ViscaCommand ) {
		if (this.socket == null) this.open();

		let packet = Buffer.from(viscaCommand.toPacket());
		if ( this.debug ) console.log( 'Sent: ' + packet );

		// sending packet
		this.socket.write( packet, ( error ) => {
			if ( error ) {
				this.socket.end();
			} else if (this.debug) {
				console.log( 'Data sent !!!' );
			}
		} );
	}
}


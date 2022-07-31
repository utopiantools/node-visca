// import {SerialPort} from "serialport"
import {EventEmitter} from 'events'
import { v4 as uuid } from 'uuid'
// import SerialPort = require("serialport")
import SerialPort  from 'serialport';
import { ViscaCommand } from './command';
import { ViscaTransport } from './transport'
const Delimiter = require( '@serialport/parser-delimiter' );

// simply implements a visca transport over the serial interface
export class SerialTransport extends EventEmitter implements ViscaTransport {
	started = false;
	serialport: SerialPort;
	uuid: string;

	constructor ( public portname = "/dev/ttyUSB0", public timeout = 1, public baudRate = 9600, public debug = false ) {
		super();
		if ( this.started ) return;
		this.uuid = uuid();

		this.start();
	}

	start() {
		if ( this.started ) return;

		// open the serial port
		try {
			this.serialport = new SerialPort( {path:this.portname, baudRate: this.baudRate, autoOpen:false } );
			this.serialport.open((err: any) => {
					if (err) {
						return console.log('Error opening port: ', err.message);
					}
				});
		
			this.serialport = new SerialPort( this.portname, { baudRate: this.baudRate, autoOpen: false } );
			this.serialport.on( 'open', this.onOpen.bind(this) );   // provides error object
			this.serialport.on( 'close', this.onClose.bind(this) ); // if disconnected, err.disconnected == true
			this.serialport.on( 'error', this.onError.bind(this) ); // provides error object

			this.serialport.pipe( new Delimiter( { delimiter: [ 0xff ] } ) )
			.on( 'data', this.onData.bind(this) );       // provides a Buffer object
			this.serialport.open((err)=>{
				if(err){
					console.log("################### Error opening serial port "+ this.portname +":");
					console.log(err);
				}else{
					console.log("################### " + this.portname +" successfully opened!!");
				}
				
				
			})

		} catch ( e ) {
			console.log( `Exception opening serial port '${this.portname}' for (display) ${e}\n` );
		}
	}

	restart() { this.close(); this.start(); }
	close() { this.serialport.close(); this.started = false; }

	onOpen() { this.started = true; this.emit( 'open' ); }
	onClose( e :string ) { console.log( e ); this.started = false; this.emit( 'close' ); }
	onError( e :string ) { 
		console.log( e ); 
		this.started = false; 
		this.emit( 'error', e ); 
	}

	onData( packet:Buffer ) {
		// the socket parser gives us only full visca packets
		// (terminated with 0xff)
		console.log( 'Received: ', packet );
		if ( this.debug ) console.log( 'Received: ' + packet );

		// convert to command packet object
		let v = ViscaCommand.fromPacket( [...packet] );

		this.emit( 'data', v );
	}

	write( viscaCommand: ViscaCommand ) {
		if ( !this.serialport.isOpen ) return;
		let packet = viscaCommand.toPacket();
		this.serialport.write( packet );
		if ( this.debug ) console.log( 'Sent: ' + packet );
	}
}

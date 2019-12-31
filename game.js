// Squids - Copyright 2019 Sleepless Software Inc All Rights Reserved

let qd = getQueryData();

DEV = !! toInt( qd.dev );
log( "DEV = " + DEV );

let random = Math.random;
let sqrt = Math.sqrt;
let max = Math.max;
let min = Math.min;
let floor = Math.floor;
let round = Math.round;
let abs = Math.abs;
let PI = Math.PI;
let PI2 = PI * 2;
let PIH = PI / 2;
let sgn = function( n ) { return n < 0 ? -1 : n > 0 ? 1 : 0; };

// return a number between 0 and n -1 inclusive 
function roll(n) {
	return floor( random() * n );
}

// return true if roll(n) returns 0, otherwise false
function zroll(n) {
	return roll( n ) == 0;
}

function nclip( n, d ) {
	d = d || 10000;
	if( abs( n ) < 0.0011 ) {
		return 0;	
	}
	return Math.round( n * d ) / d;
}

// convert number to string and pad out to 'digits' digits with 0's on the left.
// Example: zpad( 2, 3 ) == "002"
let zpad = function( num, digits ) {
	num = "" + num;
	if( num.length < digits ) {
		let a = [];
		a.length = digits - num.length;
		a.fill( "0" );
		num = a.join( "" ) + num;
	}
	return num;
};

function getImage( name ) {
	let img = sq_getImage( "data/" + name );
	//if( ! img ) {
	//	alert( "Missing image: " + name );
	//}
	return img;
}

function getSound( name ) {
	let snd = sq_getSound( "data/" + name );
	//if( ! snd ) {
	//	alert( "Missing sound: " + name );
	//}
	return snd;
}


// Create a set of sounds that can be played randomly
// Pattern should look something like "bang_#.wav", which will
// attempt to up to 100 sounds starting with "bang_00.wav", "bang_01.wav",
// up to the last one found, or 99 which ever comes first.
// The cb_init function is optional and will be called each sound as it's 
// fetched in case you want to initialize them somehow.
function SoundSet( pattern, cb_init ) {
	let set = [];

	for( let n = 0; n < 100 ; n++ ) {
		let s = pattern.replace( /#/, zpad( n, 2 ) );
		let snd = getSound( s );
		if( ! snd ) 
			break;
		if( cb_init ) {
			cb_init( snd );
		}
		set.push( snd );
	}

	// play a random sound from the set at volume 'vol'
	// if 'vary' is true, vary the sample rate randomly between 1.0 and 1.5 of normal
	this.play = function( vol, vary, rate_inc ) {
		let snd = set[ roll( set.length ) ];
		snd.volume( vol );
		if( vary ) 
			snd.rate( 1.0 + ( roll( 10 ) * 0.02 ) + (rate_inc | 0) );
		snd.play();
	}
}


// A squid set is basically an array of squid objects.
// You give the constructor the number of squids you want in the array, and
// an init function that will be called on each one when it's created.
// It has a next() function that will return the next free squid or null.
// It also has these functions that operate over all the squids in the array:
//		reset()			set alive to false
//		tick()			call sq.tick()
//		draw()			call sq.draw()
function SquidSet( num, cb_init ) {
	let set = [];

	for( let i = 0 ; i < num ; i++ ) {
		set.push( sq_create() );
	}
	if( cb_init ) {
		set.forEach( cb_init );
	}

	let next = 0;
	set.next = function( force ) {
		let sq = set[ next++ ];
		next = next % num;
		if( force )
			sq.alive = false;
		return sq.alive ? null : sq;
	}

	set.reset = function() {
		set.forEach( sq => {
			if( typeof sq.reset === "function" )
				sq.reset();
			else
				sq.alive = false;
		});
	}

	set.tick = function() {
		set.forEach( sq => { sq.tick(); });
	}

	set.draw = function() {
		set.forEach( sq => { sq.draw(); });
	}
	return set;
}


// Handles animations
function Anim( img_names, delay, loop ) {
	let imgs = img_names.map( name => { 
		let img = getImage( name );
		let c2 = document.createElement("canvas");
		let ctx2 = c2.getContext('2d');
		c2.width = img.w;
		c2.height = img.h;
		ctx2.drawImage(img.data, 0, 0);
		ctx2.fillStyle = "#FF0";
		let rtn = { w: img.w, h: img.h, data: c2 }; 
		return rtn;
	});
	let t = 0;
	let frame = 0;
	loop = !! loop
	this.tick = function() {
		if( t >= delay ) {
			t = 0;
			frame += 1;
			if( frame >= imgs.length ) {
				frame = loop ? 0 : imgs.length - 1;
			}
		}
		t += 1;
		return loop ? imgs[ frame ] : null;
	};
}


let T = 0;				// global tick counter
let KEYS = {};
let dev_msgs = [];

document.body.onload = function() {

	var score = 0;

	sq_debug( DEV );

	sq_loadAssets( [ "data/squids_logo.png" ], [], () => {

		// get size of playfield
		const dimensions = sq_useCanvas( "mycanvas" );
		var SW = dimensions.width;
		var SH = dimensions.height;

		var menu_active = false;
		let font_dev = sq_getFont( "courier", 17, "rgba(255,255,0,0.7)" );
		let font = sq_getFont( "sans-serif", 16, "rgba(255,255,255,0.7)" );		// general purpose font

		var images = [
			"squids_logo.png"
		];
		var sounds = [];
		let mx = 0, my = 0;		// mouse position
		function set_mxy( x, y ) {
			mx = x;
			my = y;
			dev_msgs[ 1 ] = "mouse " + mx + " " + my;
		}

		let lmb = false;		// left mouse button; true == down
		let lmb_edge = false;	// transition flag
		function set_lmb( b ) {
			lmb_edge = b != lmb;
			lmb = b;
			dev_msgs[ 2 ] = "lmb = " + lmb;
		}

		window[ "app_resize" ] = function(dimensions) {
			log(dimensions);	
			sq_setDimensions(window.innerWidth, window.innerHeight);
			SW = window.innerWidth;
			SH = window.innerHeight;
		};

		window[ "app_mousemove" ] = function( x, y ) {
		 	set_mxy( x, y );
		};

		window[ "app_mousedown" ] = function( x, y ) {
		 	set_mxy( x, y );
			set_lmb( true );
		};

		window[ "app_mouseup" ] = function( x, y ) {
		 	set_mxy( x, y );
			set_lmb( false );
		}

		window[ "app_keyup" ] = function( k ) {
			delete KEYS[ k ];
		};

		window[ "app_keydown" ] = function( k ) {
			KEYS[ k ] = true;
			log( "k=" + k );
			switch( k ) {
				case 192: // backtick
					DEV = ! DEV;
					sq_debug( DEV );
					break;
				case 27:
					if(!menu_active) {
						menu_active = true;
						sq_setLoop(loop_menu, 1000 / 10);
					} else {
						menu_active = false;
						sq_setLoop(loop_play, 1000 / 100);
					}
					break;
			}
		};

		let cur_level = 0;
		let level_ending = 0;
		
		let hits = sq_hitting;
		let hits_any = function( sq, sq_arr ) {
			if( sq.alive = true ) {
				for( let i = 0; i < sq_arr.length; i++ ) {
					let other = sq_arr[ i ];
					if( other.alive ) {
						if( hits( sq, other ) ) {
							return other;
						}
					}
				}
			}
			return null;
		};

		let rect_from_img = function( sq ) {
			if( sq.img ) {
				let w = sq.img.w * sq.sx;
				let h = sq.img.h * sq.sy;
				return { x: -( w * 0.5), y: -( h * 0.5 ), w: w, h: h };
			}
			return null;
		};


		// -----------------------------------------------------
		// DEFINE MENU
		// -----------------------------------------------------
		function loop_menu() {
			T += 1;
			sq_fillRect(0,0, SW, SH, "#111");
			sq_drawText("PAUSED", SW * 0.5, SH * 0.5, font, 1, "center");
		}

		// -----------------------------------------------
		// Main game play loop 
		// -----------------------------------------------
		function loop_play() {
			T += 1; dev_msgs[ 0 ] = "T " + T;
			sq_fillRect(0,0, SW, SH, "#222233");
			sq_drawText("PLAYING", SW * 0.5, SH * 0.5, font, 1, "center");
			// Draw debug info --------------------------
			if( DEV ) {
				sq_drawLine( 0, GROUND, SW - 1, GROUND, "#00ff00" );		// draw ground line
				sq_drawLine(mx, my, rocket.x, rocket.y, "rgba(255, 255, 255, 0.3)", 2);	// line from mouse to rocket
				sq_drawCross(mx, my, 15, "#0F0");			// cross at mouse x,y

			}
			dev_msgs[20] = level_ending;
			dev_msgs.forEach( ( s, i ) => {
				sq_drawText( s, 10, 18 + ( i * 18 ), font_dev, 1, "left" );
			});
		}


		// -----------------------------------------------
		// Loading screen loop
		// -----------------------------------------------
		{
			let load_progress = 0;	// tracks asset loading process; 0.0 - 1.0; 0.5 == 50% loaded
			let logo = getImage( "squids_logo.png" );

			console.log(logo);

			sq_setLoop( function() {

				T += 1;

				sq_fillRect( 0, 0, SW, SH, "#000" );	// Clear screen to black.

				let dx = SW * 0.5;
				let dy = SH * 0.3;

				sq_drawImage( logo, dx - (logo.w * 0.5), dy, 1, 0, 0, 0, 1, 1 );
				dy += logo.h * 1.2;
				sq_drawText( "Squids", dx, dy, font, 1, "center" ); 
				dy += 20;
				sq_drawText( "Copyright 2019  Sleepless Inc.  All Rights Reserved", dx, dy, font, 1, "center" ); 
				dy += 40;

				sq_drawText( "Loading ... " + (load_progress * 100) + "%", dx, dy, font, 1, "center" ); 

				if( T > (DEV ? 5 : 15) ) {
					if( load_progress >= 1.0 ) {
						// assets done loading
						sq_setLoop( loop_play, 1000 / 100 );
					}
				}

			}, 1000 / 100);

			images = images.map( name => { return "data/" + name; });		// prepend path to files
			sounds = sounds.map( name => { return "data/" + name; });	// prepend path to files

			// start the assets loading
			sq_loadAssets( images, sounds, () => {
				load_progress = 1.0;	// done loading ... picked up by loop above
			}, progress => {
				load_progress = progress;
			});
		}
	});
}

document.addEventListener('contextmenu', event => event.preventDefault());

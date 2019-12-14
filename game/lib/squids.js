
// Squids - Copyright 2019 Sleepless Software Inc All Rights Reserved
//
// This is Squids - A library for making simple games in a browser using the HTML5 canvas element.
//

(function() {

	//	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	
	// This first section is largley about glue to the underlying platform
	// (the HTML canvas element in thise case) for doing things with graphics and sound.
	//	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	

	let doc = document;
	let body = doc.body;

	let debug = false;

	let mkEl = function( s ) { return doc.createElement( s ); }

	let log = function( s ) { if(debug) console.log( "SQUIDS: "+s ); }

	// turn debug mode on/off
	sq_debug = function( b ) { debug = b ? true : false; }

	
	// Returns a handle to a fontish thing that you can pass back into sq_drawText().
	sq_getFont = function( face, sz, clr ) {
		let font = { height: sz, face: face, style: "" + sz + "px " + face, color: clr };
		return font;
	}

	// Draw some text at a given position in a given font with a given opacity and alignment (opa and align).
	sq_drawText = function( str, x, y, font, opa, align ) {
		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.font = font.style;
		ctx.fillStyle = font.color; //'rgba(0, 100, 0, '+opa+')';
		ctx.textBaseline = 'middle';
		ctx.textAlign = align || 'center';
		// XXX opacity
		ctx.fillText( str, x, y );
		let w = ctx.measureText( str ).width;
		ctx.restore();
	}

	//	-	-	-	-	-	-

	let imgs = {};
	let snds = {};

	// Takes an array of image file names, and starts them loading.
	// When they're all loaded, the cb is called.
	sq_loadAssets = function( img_files, snd_files, cb ) {

		let imgs_still_loading = img_files.length;
		img_files.forEach( file => {
			let e = mkEl( "img" );
			e.src = file;
			e.style.display = "none";
			e.onload = function() {
				imgs[ file ] = e;
				imgs_still_loading -= 1;
				log( imgs_still_loading + ": img loaded " + file )
				if(imgs_still_loading == 0) {
					log( "all images loaded" );
					if(cb)
						cb();
				}
			};
			e.onerror = function( err ) {
                e.src = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDgxcHgiIGhlaWdodD0iNDgxcHgiIHZpZXdCb3g9IjAgMCA0ODEgNDgxIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0OC4yICg0NzMyNykgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+R3JvdXAgMzwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgogICAgICAgIDxyZWN0IGlkPSJwYXRoLTEiIHg9IjAiIHk9IjAiIHdpZHRoPSI0ODEiIGhlaWdodD0iNDgxIiByeD0iNTMiPjwvcmVjdD4KICAgIDwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJHcm91cC0zIj4KICAgICAgICAgICAgPGcgaWQ9IlJlY3RhbmdsZS0zIj4KICAgICAgICAgICAgICAgIDx1c2UgZmlsbD0iI0Q2RDZENiIgZmlsbC1ydWxlPSJldmVub2RkIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT4KICAgICAgICAgICAgICAgIDxyZWN0IHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIyMSIgeD0iMTAuNSIgeT0iMTAuNSIgd2lkdGg9IjQ2MCIgaGVpZ2h0PSI0NjAiIHJ4PSI1MyI+PC9yZWN0PgogICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDxnIGlkPSJHcm91cC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg4Ni4wMDAwMDAsIDkwLjAwMDAwMCkiIGZpbGw9IiMwMDAwMDAiPgogICAgICAgICAgICAgICAgPGcgaWQ9Ikdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0OS41MDAwMDAsIDQ5LjUwMDAwMCkgcm90YXRlKC00NS4wMDAwMDApIHRyYW5zbGF0ZSgtNDkuNTAwMDAwLCAtNDkuNTAwMDAwKSAiIHg9IjQwIiB5PSItMTEiIHdpZHRoPSIxOSIgaGVpZ2h0PSIxMjEiPjwvcmVjdD4KICAgICAgICAgICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0OS41MDAwMDAsIDQ5LjUwMDAwMCkgcm90YXRlKC0xMzUuMDAwMDAwKSB0cmFuc2xhdGUoLTQ5LjUwMDAwMCwgLTQ5LjUwMDAwMCkgIiB4PSI0MCIgeT0iLTExIiB3aWR0aD0iMTkiIGhlaWdodD0iMTIxIj48L3JlY3Q+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iR3JvdXAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIxMC4wMDAwMDAsIDAuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDkuNTAwMDAwLCA0OS41MDAwMDApIHJvdGF0ZSgtNDUuMDAwMDAwKSB0cmFuc2xhdGUoLTQ5LjUwMDAwMCwgLTQ5LjUwMDAwMCkgIiB4PSI0MCIgeT0iLTExIiB3aWR0aD0iMTkiIGhlaWdodD0iMTIxIj48L3JlY3Q+CiAgICAgICAgICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDkuNTAwMDAwLCA0OS41MDAwMDApIHJvdGF0ZSgtMTM1LjAwMDAwMCkgdHJhbnNsYXRlKC00OS41MDAwMDAsIC00OS41MDAwMDApICIgeD0iNDAiIHk9Ii0xMSIgd2lkdGg9IjE5IiBoZWlnaHQ9IjEyMSI+PC9yZWN0PgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik02NiwzNjQuMTczOTEzIEMxNDIuNzU5MjI2LDMxOC43MjQ2MzggMjAwLjkyNTg5MywyOTYgMjQwLjUsMjk2IEMyODAuMDc0MTA3LDI5NiAzMzguMjQwNzc0LDMxOC43MjQ2MzggNDE1LDM2NC4xNzM5MTMgTDQxNSwzOTQgQzMzNy41NzkwOSwzNTAuNDQ0NDQ0IDI3OS40MTI0MjMsMzI4LjY2NjY2NyAyNDAuNSwzMjguNjY2NjY3IEMyMDEuNTg3NTc3LDMyOC42NjY2NjcgMTQzLjQyMDkxLDM1MC40NDQ0NDQgNjYsMzk0IEw2NiwzNjQuMTczOTEzIFoiIGlkPSJSZWN0YW5nbGUtMiIgZmlsbD0iIzAwMDAwMCI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+";
                imgs_still_loading -= 1;
                log( imgs_still_loading + ": ERROR: "+err+": " + file )
                if(imgs_still_loading == 0) {
                    log( "all images loaded" );
                    if(cb)
                        cb();
                }
			};
			body.appendChild( e );
		});

		//Howler.autoUnlock = false;
		let sounds_still_loading = snd_files.length;
		snd_files.forEach( file => {
			let e = new Howl({
				src: [file], 
				volume: 1,
				onload: () => {
					//console.log(`${file} loaded`);
					sounds_still_loading -= 1;
				},
				onloaderror: () => {
					//console.log(`${file} could not be loaded`);
				},
				onplayerror: () => {
					//console.log(`${file} could not be played`);
				},
				onend: () => {
					//console.log(`${file} finished`);
				}
			});

			snds[ file ] = e;
		});

	}

	// Returns an object that can be passed back into sq_drawImage().
	// It will be null if the image hasn't been loaded via sq_loadAssets().
	sq_getImage = function( file ) {
		let e = imgs[ file ];
		if( ! e ) {
			return null;
		}
		let image = {
			w: e.width,
			h: e.height,
			data: e,
		};
		return image;
	}

	// Draw image onto canvas at dx,dy, with opacity, rotation, and scaling
	// dx,dy = destination x,y
	// opa = opacity
	// rot = rotation angle
	// px,py = x,y of pivot point for rotation image top-left corner
	// sx,sy = scaling factor 1.0 = normal size
	sq_drawImage = function( img, dx, dy, opa, rot, px, py, sx, sy ) {
		ctx.save();
		ctx.imageSmoothingEnabled = false;

		ctx.globalAlpha = opa;

		if( rot == 0 ) {
			ctx.drawImage( img.data, 0, 0, img.w, img.h, dx, dy, img.w * sx, img.h * sy );
		} else {

			let dw = img.w * sx;		// dest width, height
			let dh = img.h * sy;

			ctx.translate( dx + px, dy + py );
			ctx.rotate( rot );
			ctx.translate( -(dx + px), -(dy + py) );

			ctx.drawImage( img.data, 0, 0, img.w, img.h, dx, dy, img.w * sx, img.h * sy );

		}

		if( debug ) {
			let dw = img.w * sx;
			let dh = img.h * sy;

			// draw purple box around image
			ctx.strokeStyle = "#f0f";
			ctx.strokeRect( dx, dy, dw, dh );

			// draw red crosshair at dx, dy
			sq_drawCross( dx, dy, 30, "#f00" );
		}

		ctx.restore();
	}

	// draw a crosshair at dx, dy
	sq_drawCross = function( dx, dy, sz, clr ) {
		sz = sz || 25;
		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.strokeStyle = clr || "#0ff";
		ctx.beginPath();
		ctx.moveTo( dx - sz, dy );
		ctx.lineTo( dx + sz, dy );
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo( dx, dy - sz );
		ctx.lineTo( dx, dy + sz );
		ctx.stroke();
		ctx.restore();
	}


	sq_clearRect = function( x, y, w, h) {
		ctx.clearRect( x, y, w, h );
	}

	sq_fillRect = function( x, y, w, h, clr ) {
		ctx.restore();
		ctx.fillStyle = clr;
		ctx.fillRect( x, y, w, h );
		ctx.restore();
	}


	sq_drawCircle = function( dx, dy, r, clr, fill) {
		if(fill) {
			ctx.fillStyle = clr;
		} else {
			ctx.strokeStyle = clr;
		}
		ctx.beginPath();
		ctx.arc( dx, dy, r, 0, Math.PI * 2, false );
		if(fill) { 
			ctx.fill();
		} else {
			ctx.stroke();
		}
	}

	sq_getSound = function( file ) {
		return snds[ file ];
	}

	sq_playSound = function( snd, vol ) {
		// XXX make volume work
		snd.play();
	}

	//	-	-	-	-	-	-

	// persistent data storage
	// XXX Fix to use localStorage, or this dumb ds object if running from file://
	let ds = {};

	sq_loadData = function( key ) {
		return ds[ key ];
	}

	sq_saveData = function( key, val ) {
		return ds[ key ] = val;
	}

	//	-	-	-	-	-	-

	let canvas = null;
	let ctx = null;

	sq_useCanvas = function( canvas_id ) {

		canvas = doc.getElementById( canvas_id );
		if( ! canvas )
			throw new Error( "Canvas not found with id "+canvas_id );

		ctx = canvas.getContext( "2d" );
		ctx.imageSmoothingEnabled = false;

		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;

		document.body.onresize = function( evt ) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			let f = window[ "app_resize" ];
			if( typeof f === "function" ) {
				f( {
					width: canvas.clientWidth,
					height: canvas.clientHeight,
				} );
			}
		};

		canvas.oncontextmenu = window.oncontextmenu = () => { return false; };

		canvas.onmousedown = function( evt ) {
			evt.preventDefault();
			let mx = evt.clientX - canvas.offsetLeft;
			let my = evt.clientY - canvas.offsetTop;
			let btn = evt.button;
			let f = window[ "app_mousedown" ];
			if( typeof f === "function" ) {
				f( mx, my, btn );
			}
		};

		canvas.onmouseup = function( evt ) {
			evt.preventDefault();
			let mx = evt.clientX - canvas.offsetLeft;
			let my = evt.clientY - canvas.offsetTop;
			let btn = evt.button;
			let f = window[ "app_mouseup" ];
			if( typeof f === "function" ) {
				f( mx, my, btn );
			}
		};

		canvas.onmousemove = function( evt ) {
			let mx = evt.clientX - canvas.offsetLeft;
			let my = evt.clientY - canvas.offsetTop;
			let f = window[ "app_mousemove" ];
			if( typeof f === "function" ) {
				f( mx, my );
			}
		};

		canvas.onkeyup = window.onkeyup = function (evt) {
			let key = evt.key;
			let f = window["app_keyup"];
			if( typeof f === "function" ) {
				f(key);
			}
		}

		canvas.onkeydown = window.onkeydown = function (evt) {
			let key = evt.key;
			let f = window["app_keydown"];
			if( typeof f === "function" ) {
				f(key);
			}
		}

		return {
			width: canvas.clientWidth,
			height: canvas.clientHeight,
		};
	}


	//	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	
	// This next section contains the functions that deal with actual
	// "squids" which are graphical sprite-like object that can move around
	// on the screen.
	//	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	-	

	let sqrt = Math.sqrt
	let sin = Math.sin
	let cos = Math.cos
	let floor = Math.floor
	let abs = Math.abs
	let atan2 = Math.atan2
	let PI = Math.PI
	let PI2 = PI * 2
	let PIH = PI / 2

	// return a unique integer
	let seqNum = 0;
	let seq = function() { seqNum = seqNum + 1; return seqNum; }

	// return a number from 0.0 thru PI * 2 for use as rot value
	sq_azimuth = function(sx, sy, tx, ty) { let a = atan2(ty - sy, tx - sx) + PIH; return a; }

	// convert heading/angle to cartesion coords for distance 1.0
	sq_cartes = function(az) { az = az - PI; return [ sin(az), -cos(az) ]; }

	sq_screenWrap = function(sq) {
		if( sq.x >= sw ) { 
			sq.x = 0;
		}
		else
		if( sq.x < 0 ) {
			sq.x = sw - 1
		}

		if( sq.y >= sh ) { 
			sq.y = 0;
		}
		else
		if( sq.y < 0 ) {
			sq.y = sh - 1
		}
	}

	// Default squid tick function.
	// Applies some pseudo-newtonian motion to a squid
	sq_tick = function(sq) {
		// apply velocity
		sq.x = sq.x + sq.vx;
		sq.y = sq.y + sq.vy;
		// apply gravity
		sq.vx = sq.vx + sq.gx;
		sq.vy = sq.vy + sq.gy;
		// apply friction
		sq.vx = sq.vx - sq.fx;
		sq.vy = sq.vy - sq.fy;

		// apply rotational velocity, acceleration, and friction 
		sq.r = sq.r + sq.vr;
		if(sq.r > PI2) { sq.r = sq.r - PI2 };
		if(sq.r < 0) { sq.r = sq.r + PI2 };
		sq.vr = sq.vr + sq.ra;
		sq.vr = sq.vr - sq.rf;
	}

	// Default squid draw function.
	sq_draw = function(sq) {
		if(sq.alive && sq.img) {
			let img = sq.img;
			let scalex = sq.sx;					// width scaling factor
			let scaley = sq.sy;					// height scaling factor
			let destw = img.w * scalex;			// width of scaled img to dest
			let desth = img.h * scaley;			// height of scaled img to dest
			let destx = sq.x - (destw / 2);		// offset left 1/2 img width
			let desty = sq.y - (desth / 2);		// offset up 1/2 img height
			sq_drawImage(sq.img, destx, desty, sq.a, sq.r, sq.px * scalex, sq.py * scaley, scalex, scaley);
			if( debug ) {
				sq_drawCross( sq.x, sq.y );		// draw a crosshair at the squids x,y
			}
		}
	}

	// This is the basic squid object
	let ProtoSquid = function() {
		let sq = {
			id: 0,
			img: null,
			x: 0, y: 0,			// position
			vx: 0, vy: 0,		// velocity
			gx: 0, gy: 0,		// gravity  - increases velocity downward over time
			fx: 0, fy: 0,		// friction - slows down velocity over time
			sx: 1.0, sy: 1.0,	// scale
			r: 0,				// rotation
			vr: 0,				// rotational velocity
			ra: 0,				// rotational acceleration
			rf: 0,				// rotational friction
			px: 0, py: 0,		// pivot point
			a: 1.0,				// alpha (opacity)
			radius: 0,			// for circular collisions
			alive: false,
			tick: function() { sq_tick( this ); },		// replaceable tick function
			draw: function() { sq_draw( this ); },		// replaceable draw function
		}
		return sq;
	}

	// Create a simple, basic squid with an image, and a position
	sq_create = function(img, x, y) {
		let o = new ProtoSquid();
		o.id = seq();
		o.img = null;
		if( img ) {
			o.img = img;
			o.px = img.w / 2;
			o.py = img.h / 2;
		}
		o.x = x || 0;
		o.y = y || 0;
		return o;
	}

	// Return true if hx, hy is within the rect of a squids image.
	// Note: This is rectangular collision test and based on its imagery
	sq_hitXY = function(sq, hx, hy) {
		let x = sq.x, y = sq.y;
		let img = sq.img;
		if(img == null) { return false; }
		let w2 = img.w / 2;
		let h2 = img.h / 2;
		if(hx < x - w2) { return false; }
		if(hx > x + w2) { return false; }
		if(hy < y - h2) { return false; }
		if(hy > y + h2) { return false; }
		return true;
	}

	// Return true if two squids, have overlapping radii
	// Note: This is circular collision test
	sq_hit = function(sq1, sq2) {
		if(sq1.alive && sq2.alive) {
			let rHit = (sq1.radius * sq1.radius) + (sq2.radius * sq2.radius);
			let xx = abs(sq2.x - sq1.x);
			let yy = abs(sq2.y - sq1.y);
			let rDist = (xx * xx) + (yy * yy);
			return rDist < rHit;
		}
		return false;
	}

})();

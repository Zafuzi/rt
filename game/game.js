// -------------------------------------------------------
// Some math stuff
// -------------------------------------------------------
let max = Math.max;
let min = Math.min;
let sqrt = Math.sqrt;
let sin = Math.sin;
let cos = Math.cos;
let floor = Math.floor;
let abs = Math.abs;
let round = Math.round;
let atan2 = Math.atan2;
let PI = Math.PI;
let PI2 = PI * 2;
let PIH = PI / 2;

// apply some stupid semi-newtonian motion to a squid
function newton(sq) {
	// apply velocity
	sq.x = (sq.x + sq.vx);
	sq.y = (sq.y + sq.vy);
	// apply gravity
	sq.vx = sq.vx + sq.gx;
	sq.vy = sq.vy + sq.gy;

	// apply rotational velocity, acceleration, and friction 
	sq.r = sq.r + sq.vr;
	if(sq.r > PI2) { sq.r = sq.r - PI2 };
	if(sq.r < 0) { sq.r = sq.r + PI2 };
	sq.vr = sq.vr + sq.ra;
	sq.vr = sq.vr - sq.rf;
}

function screenWrap(sq) {
	if( sq.x >= game.SW ) { 
		sq.x = 0;
	}
	else
	if( sq.x < 0 ) {
		sq.x = game.SW - 1
	}

	if( sq.y >= game.SH ) { 
		sq.y = 0;
	}
	else
	if( sq.y < 0 ) {
		sq.y = game.SH - 1
	}

}

// return true if two squids, have overlapping radii
function hitArc(sq1, sq2) {
	if(sq1.alive && sq2.alive) {
		let rHit = (sq1.radius * sq1.radius) + (sq2.radius * sq2.radius);
		let xx = abs(sq2.x - sq1.x);
		let yy = abs(sq2.y - sq1.y);
		let rDist = (xx * xx) + (yy * yy);
		return rDist < rHit;
	}
	return false;
}

// return true if hx, hy is within the rect of a squids image.
function hitRect(sq, hx, hy) {
	if(!sq.alive) { return false; }
	let img = sq.img;
	if(img == null) { return false; }
	let x = sq.x, y = sq.y;
	let w2 = (img.w * sq.sx) * 0.5;
	let h2 = (img.h * sq.sy) * 0.5;
	if(hx < x - w2) { return false; }
	if(hx > x + w2) { return false; }
	if(hy < y - h2) { return false; }
	if(hy > y + h2) { return false; }
	return true;
}

app_keyup = function(key) {
	game.keys_down[key] = 0;
}
app_keydown = function(key) {
	game.keys_down[key] = 1;
}

var plant_zombie = function() {
	if(game.player.planting) return;
	console.log(game.player.inventory.seeds.zombie);
	if(game.player.inventory.seeds.zombie > 0) {
		game.player.planting = true;
		let can_plant = true;
		game.plants.zombie.forEach(z => {
			console.log("HITTING: ", hitRect(z, game.player.x, game.player.y));
			if(hitRect(z, game.player.x + 20, game.player.y + 20)) {
				can_plant = false;
				log("cannot plant here");
			}
		});
		if(can_plant) {
			let sq = sq_create(sq_getImage("zombie_ripe.png"), game.player.x, game.player.y);
			sq.sx = 0.25;
			sq.sy = 0.25;
			sq.alive = true;
			game.plants.zombie.push(sq);
			game.player.inventory.seeds.zombie--;
			console.log("ZOMBIE PLANTED: " + game.player.x + ", " + game.player.y);
		}
		setTimeout(() => {
				game.player.planting = false;
		}, 1000);
	}
}

var game = {
	t: 0,
	SW: 800,
	SH: 600,
	images: ["rt.png", "zombie_ripe.png"],
	sounds: ["rt.wav", "dumb.wav"],
	fonts: {
		system: null
	},
	player: null,
	plants: {
		zombie: []
	},
	music: null,
	keys_down: {},
	tick: function() {
		Object.keys(game.keys_down).forEach(key => {
			let val = game.keys_down[key];
			if(val === 1) {
				switch(key) {
				 	case 'n':
						music.volume(0.8);
						break;
					case 'm':
						music.volume(0);
						break;
				 	case 'w':
						game.player.vy = -game.player.speed;
						break;
					case 's':
						game.player.vy = game.player.speed; 
						break;
				 	case 'a':
						game.player.vx = -game.player.speed;
						break;
					case 'd':
						game.player.vx = game.player.speed;
						break;
					case 'j':
							plant_zombie();
							break;
					default: break;
				}
			}
		});
		game.plants.zombie.forEach( z => {
			z.tick();
		});
		game.player.tick();
	},
	draw: function() {
		sq_clearRect(0,0,game.SW,game.SH);
		let ty = 20;
		sq_drawText("TICK: " + game.t, 20, ty, game.fonts.system, 0.5, "left");
		ty += 26;
		Object.keys(game.keys_down).forEach(key => {
			let val = game.keys_down[key];
			if(val === 1) {
				sq_drawText(key, 20, ty, game.fonts.system, 0.5, "left");
				ty += 26;
			}
		});
		sq_drawText("ZOMBIE SEEDS: " + game.player.inventory.seeds.zombie, game.SW - 20, 20, game.fonts.system, 0.5, "right");
	
		game.plants.zombie.forEach( z => {
			z.draw();
		});
		game.player.draw();
	},
	loop: function() {
		game.t++;
		game.SW = window.innerWidth;
		game.SH = window.innerHeight;

		game.tick();
		game.draw();
		
		window.requestAnimationFrame(game.loop);
	},
	init: function() {
		sq_loadAssets(game.images, game.sounds, () => {
			log("Game Initialized");

			game.SW = window.innerWidth;
			game.SH = window.innerHeight;
			//sq_debug(true);
			sq_useCanvas("mycanvas", game.SW, game.SH);

			game.player = sq_create(sq_getImage("rt.png"), game.SW * 0.5, game.SH * 0.5);
			game.player.alive = true;

			game.player.speed = 3;

			game.player.planting = false;

			game.player.inventory = {
				seeds: {
					zombie: 10
				}
			};

			game.player.tick = function() {
				let sq = this;
				
				newton(this);

				sq.vx = sq.vx * 0.1;		// reduce my velocity by 10% (?)
				sq.vy = sq.vy * 0.1;

				screenWrap(this);

				sq_tick(this);
			}

			music = sq_getSound("dumb.wav");
			music._loop = true;
			music.play();

			game.fonts.system = sq_getFont( "Arial", 26, "#abc" );

			window.requestAnimationFrame(game.loop);
		});
	}
}

document.addEventListener("DOMContentLoaded", e => {
	game.init();
});

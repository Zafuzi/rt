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

app_mousemove = function(x, y) {
	game.mx = x;
	game.my = y;
}

function toggle_action_buttons() {
	Object.keys(game.ui).forEach(ui_key => {
		let sq = game.ui[ui_key];
		if(sq.toggle)
			sq.active = false;
	});
}

var handle_left_click = function(x,y) {
	// All left clicks anywhere disable active ui elements
	Object.keys(game.ui).forEach(ui_key => {
		let sq = game.ui[ui_key];
		if(!sq.toggle)
			sq.active = false;
	});
	if(game.ui.sickle.active) {
		Object.keys(game.plants).forEach(p => {
			game.plants[p].forEach(sq => {
				if(!sq.ripe) return;
				let can_harvest = player_close_enough(x,y);
				if(!can_harvest) return;
				if(hitArc({alive: true, radius: 60, x: x, y: y}, sq)) {
					let cut = sq_getSound("music/cut.wav");
					cut.play();
					sq.alive = false;
					game.player.inventory.seeds[sq.drop] += 1;
					toggle_action_buttons();
					game.ui.sickle.active = true;
				}
			});
		});
	}
	if(game.ui.watering_can.active) {
		Object.keys(game.plants).forEach(p => {
			game.plants[p].forEach(sq => {
				if(!sq.water) return;
				let can_water = player_close_enough(x,y);
				if(!can_water) return;
				if(sq.has_been_watered) return;
				if(hitArc({alive: true, radius: 60, x: x, y: y}, sq)) {
					let water = sq_getSound("music/gulp.wav");
					water.play();
					sq.has_been_watered = true;
				}
			});
		});
		toggle_action_buttons();
		game.ui.watering_can.active = true;
	}
	let click = sq_getSound("music/switch.wav");
	if(hitRect(game.ui.zombie_seeds, x, y)) {
		game.ui.zombie_seeds.active = !game.ui.zombie_seeds.active;
		click.play();
	}
	if(hitRect(game.ui.bone_seeds, x, y)) {
		game.ui.bone_seeds.active = !game.ui.bone_seeds.active;
		click.play();
	}
	if(hitRect(game.ui.sickle, x, y)) {
		toggle_action_buttons();
		game.ui.sickle.active = !game.ui.sickle.active;
		click.play();
	}
	if(hitRect(game.ui.watering_can, x, y)) {
		toggle_action_buttons();
		game.ui.watering_can.active = !game.ui.watering_can.active;
		click.play();
	}
	let dont_play_poof = false;
	Object.keys(game.ui).forEach(ui_key => {
		let sq = game.ui[ui_key];
		if(sq.active) dont_play_poof = true;
	});
	if(!dont_play_poof) {
		let click = sq_getSound("music/dup.mp3");
		click.play();
	}
}

var handle_right_click = function(x, y) {
	if(game.ui.zombie_seeds.active) {
		plant("zombie",x,y);
	}
	if(game.ui.bone_seeds.active) {
		plant("bones",x,y);
	}
}


app_mouseup = function(x,y, btn) {
	switch(btn) {
		case 0: // Left mouse button
			game.mouse_btns_down["left"] = 0;
			break;
		case 2: // Right mouse button
			game.mouse_btns_down["right"] = 0;
			break;
	}
}

app_mousedown = function(x,y, btn) {
	console.log("click at: ", x, y, btn);
	switch(btn) {
		case 0: // Left mouse button
			game.mouse_btns_down["left"] = 1;
			break;
		case 2: // Right mouse button
			game.mouse_btns_down["right"] = 1;
			break;
	}
}

// Is click within player radius
var player_close_enough = function(x, y) {
	if(hitArc({alive: true, radius: 100, x: x, y: y}, game.player)) {
		return true;
	} else {
		return false;
	}
}

var plant = function(name, x, y) {
	if(game.player.planting) return;
	let can_plant = player_close_enough(x,y);
	if(!can_plant) return;
	let amt = game.player.inventory.seeds[name];
	if(amt == 0) return;

	game.player.planting = true;
	// Loop through all the plants in the game to tell if I can plant in this location
	Object.keys(game.plants).forEach(p => {
		game.plants[p].forEach(sq => {
			if(hitRect(sq, x, y)) {
				can_plant = false;
				log("cannot plant here");
				game.player.planting = false;
				return;
			}
		});
	});

	if(!can_plant) return;
	// OKAY TO PLANT
	
	let phase_images = [];
	phase_images.push(sq_getImage("img/" + name + "_grave_64.png"), sq_getImage("img/" + name + "_sapling_64.png"), sq_getImage("img/" + name + "_ripe_64.png"));


	let sq = sq_create(phase_images[0], x, y);
		sq.alive = true;
		sq.wave_direction = {x: 1, y: 1};
		sq.growth = 0;
		sq.growth_rate = 0.1;
		sq.ripe = false;
		switch(name) {
			case 'zombie': sq.drop = "bones"; sq.p1 = 60; sq.p2 = 120; break;
			case 'bones': sq.drop = "zombie"; sq.p1 = 120; sq.p2 = 240; break;
			default: sq.p1 = 60; sq.p2 = 120; break;
		}
		sq.tick = function() {
			let z = this;
			if(z.sx >= 1.002) {
				z.wave_direction.x = -1;
			}
			if(z.sx <= 0.998) {
				z.wave_direction.x = 1;
			}
			if(z.sy >= 1.002) {
				z.wave_direction.y = -1;
			}
			if(z.sy <= 0.998) {
				z.wave_direction.y = 1;
			}
			if(game.t % 15 === 0) {
				z.sx += Math.random() / 100 * z.wave_direction.x;
			}
			if(game.t % 25 === 0) {
				z.sy += Math.random() / 100 * z.wave_direction.y;
			}

			if(z.growth >= sq.p1) {
				z.img = phase_images[1];
				z.water = true;
				if(z.growth >= sq.p2) {
					z.img = phase_images[2]; 
					z.ripe = true;
				}
			}
			if(z.water) {
				if(!z.has_been_watered) {
					// NEEDS WATER
					if(!z.wd) {
						let wd = sq_create(game.water_drop_img, z.x, z.y - z.img.h/2 * z.sy - 20 - game.water_drop_img.h/2); 
						wd.alive = true;
						wd.plant = z;
						game.water_drops.push(wd);
						z.wd = wd;
					}
				} else {
					z.wd.alive = false;
					if(!z.ripe) {
						z.growth += z.growth_rate;
					} else {
						// RIPE NEEDS HARVEST
						if(!z.hi) {
							let hi = sq_create(game.harvest_img, z.x, z.y - z.img.h/2 * z.sy - 20 - game.harvest_img.h/2); 
							hi.alive = true;
							hi.plant = z;
							game.harvest_icons.push(hi);
							z.hi = hi;
						}
					}
				}
			} else {
				z.growth += z.growth_rate;
			}
		}
		game.plants[name].push(sq);
		game.player.inventory.seeds[name]--;
		// TODO change this per name?
		let shovel = sq_getSound("music/shovel.wav");
		shovel.play();
		setTimeout(() => {
				game.player.planting = false;
		}, 5);
}

var game = {
	t: 0,
	SW: 800,
	SH: 600,
	images: [
		"img/bones.png",
		"img/brain.png",
		"img/cactus.png",
		"img/sickle.png",
		"img/harvest.png", 
		
		"img/rock.png",
		"img/mch_idle.png", 
		"img/tree.png",

		"img/watering_can.png", 
		"img/water_drop.png", 
		"img/water_drop_red.png", 

		"img/bones_ripe_64.png", 
		"img/bones_sapling_64.png", 
		"img/bones_grave_64.png", 

		"img/zombie_ripe_64.png", 
		"img/zombie_sapling_64.png", 
		"img/zombie_grave_64.png" 
	],
	sounds: [
		"music/cut.wav", 
		"music/dumb.wav", 
		"music/dup.mp3", 
		"music/rt.wav", 
		"music/gulp.wav", 
		"music/shovel.wav", 
		"music/step.wav", 
		"music/switch.wav", 
		"music/under_the_moonrise.mp3"
	],
	fonts: {
		system: null
	},
	player: null,
	plants: {
		zombie: [],
		bones: []
	},
	ui: {},
	water_drop_img: null,
	harvest_img: null,
	water_drops: [],
	harvest_icons: [],
	music: null,
	keys_down: {},
	mouse_btns_down: {},
	clicking: false,
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
						game.player.moving = true;
						break;
					case 's':
						game.player.vy = game.player.speed; 
						game.player.moving = true;
						break;
				 	case 'a':
						game.player.vx = -game.player.speed;
						game.player.moving = true;
						break;
					case 'd':
						game.player.vx = game.player.speed;
						game.player.moving = true;
						break;
					case '1':
						let s = game.ui.sickle;
						if(s.active) return;
						handle_left_click(s.x, s.y);
						break;
					case '2':
						let w = game.ui.watering_can;
						if(w.active) return;
						handle_left_click(w.x, w.y);
						break;
					case 'Escape':
						toggle_action_buttons();
						break;
					default: break;
				}
			}
		});

		Object.keys(game.mouse_btns_down).forEach(btn => {
			if(!game.clicking) {
				let val = game.mouse_btns_down[btn];
				if(val === 1) {
					switch(btn) {
						case "left":
							game.clicking = true;
							setTimeout(() => { game.clicking = false; }, 250);
							handle_left_click(game.mx, game.my);
							break;
						case "right":
							game.clicking = true;
							setTimeout(() => { game.clicking = false; }, 250);
							handle_right_click(game.mx, game.my);
							break;
					}
				}
			}
		});

		if(game.t % 250 === 0) {
			game.player.inventory.seeds.zombie += 1;
		}

		// Tick the game ui
		Object.keys(game.ui).forEach(ui_key => {
			let sq = game.ui[ui_key];
			sq.tick();
		});
		// TICK BG ELEMENTS
		//game.cacti.forEach(c => {  c.tick(); });
		// Tick all the plants
		Object.keys(game.plants).forEach(p => {
			game.plants[p].forEach(sq => {
				sq.tick();	
			});
		});
		game.water_drops.forEach( wd => { if(wd.plant.alive) {wd.tick();} });
		game.harvest_icons.forEach( wd => { if(wd.plant.alive) {wd.tick();} });
		game.player.tick();
	},
	draw: function() {
		sq_clearRect(0,0,game.SW,game.SH);

		//game.cacti.forEach(c => {  c.draw(); });
		// Draw all the plants
		Object.keys(game.plants).forEach(p => {
			game.plants[p].forEach(sq => {
				sq.draw();	
			});
		});
		game.water_drops.forEach( wd => { if(wd.plant.alive) {wd.draw();} });
		game.harvest_icons.forEach( wd => { if(wd.plant.alive) {wd.draw();} });

		sq_drawDoughnut(game.player.x, game.player.y, game.player.radius, game.SW + game.SH, "rgba(0,0,0,0.84)");

		let ty = 20;
		sq_drawText("TICK: " + game.t, 20, ty, game.fonts.system, 0.5, "left");
		ty += 26;
		// Draw the keys being pressed
		Object.keys(game.keys_down).forEach(key => {
			let val = game.keys_down[key];
			if(val === 1) {
				sq_drawText(key, 20, ty, game.fonts.system, 0.5, "left");
				ty += 26;
			}
		});
		// Draw the game ui
		Object.keys(game.ui).forEach(ui_key => {
			let sq = game.ui[ui_key];
			if(sq.active) {
				sq_fillRect(sq.x - sq.img.w/2 * sq.sx - 2, sq.y - sq.img.h/2 * sq.sy - 2, sq.img.w + 4, sq.img.h + 4, sq.clr || "#FF0");
				if(sq.toggle) {
					sq_drawCircle(game.mx, game.my, 60, "#ff0");
				} else {
					sq_fillRect(game.mx - 32, game.my - 32, 64, 64, "rgba(50,55,75,.3)");
				}
			}
			sq.draw();
		});

		sq_fillRect(game.ui.zombie_seeds.x - game.ui.zombie_seeds.img.w/2, game.SH - 20 - game.ui.zombie_seeds.img.h, game.ui.zombie_seeds.img.w, game.ui.zombie_seeds.img.h, "rgba(0, 0, 0, .5)");
		sq_fillRect(game.ui.bone_seeds.x - game.ui.zombie_seeds.img.w/2, game.SH - 20 - game.ui.zombie_seeds.img.h, game.ui.zombie_seeds.img.w, game.ui.zombie_seeds.img.h, "rgba(0, 0, 0, .5)");

		sq_drawText(game.player.inventory.seeds.zombie, game.ui.zombie_seeds.img.w/2 + 20, game.SH - 20 - game.ui.zombie_seeds.img.h/2, game.fonts.seed, 1, "center");
		sq_drawText(game.player.inventory.seeds.bones, game.ui.bone_seeds.x, game.SH - 20 - game.ui.zombie_seeds.img.h/2, game.fonts.seed, 1, "center");
	

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

			game.player = sq_create(sq_getImage("img/mch_idle.png"), game.SW * 0.5, game.SH * 0.5);
			game.player.alive = true;

			game.player.speed = 3;

			game.player.planting = false;

			game.player.radius = 200;

			game.player.inventory = {
				seeds: {
					zombie: 10,
					bones: 0
				}
			};

			game.player.step_sound = sq_getSound("music/step.wav");
			game.player.tick = function() {
				let sq = this;
				
				newton(this);

				sq.vx = sq.vx * 0.1;		// reduce my velocity by 10% (?)
				sq.vy = sq.vy * 0.1;

				if(Math.abs(sq.vx) < .01) sq.vx = 0;
				if(Math.abs(sq.vy) < .01) sq.vy = 0;

				screenWrap(this);
				if(sq.vx == 0 && sq.vy == 0) {
					sq.moving = false;
				}
				if(game.t % 18 === 0 && sq.moving) {
					sq.step_sound.play();	
				}
				sq_tick(this);
			}

			// -------------
			// DEFINE GAME UI HERE
			// -------------
			let zombie_seed_image = sq_getImage("img/brain.png");
			game.ui.zombie_seeds = sq_create(zombie_seed_image, 20 + zombie_seed_image.w / 2, game.SH - 20 - zombie_seed_image.h/2);
			game.ui.zombie_seeds.alive = true;
			game.ui.zombie_seeds.tick = function() {
				let sq = this;
				sq.y = game.SH - 20 - zombie_seed_image.h/2;
				sq_tick(this);
			}

			let bone_seed_image = sq_getImage("img/bones.png");
			game.ui.bone_seeds = sq_create(bone_seed_image, 40 + zombie_seed_image.w + bone_seed_image.w / 2, game.SH - 20 - zombie_seed_image.h/2);
			game.ui.bone_seeds.alive = true;
			game.ui.bone_seeds.tick = function() {
				let sq = this;
				sq.y = game.SH - 20 - zombie_seed_image.h/2;
				sq_tick(this);
			}

			let sickle_image = sq_getImage("img/sickle.png");
			game.ui.sickle = sq_create(sickle_image, 20 + sickle_image.w / 2, game.SH - 20 - zombie_seed_image.h - sickle_image.h/2 - 20);
			game.ui.sickle.alive = true;
			game.ui.sickle.toggle = true;
			game.ui.sickle.clr = "#5F97EA";
			game.ui.sickle.tick = function() {
				let sq = this;
				sq.y = game.SH - 20 - zombie_seed_image.h - sickle_image.h/2 - 20;
				sq_tick(this);
			}

			let watering_can_image = sq_getImage("img/watering_can.png");
			game.ui.watering_can = sq_create(watering_can_image, sickle_image.w + 40 + watering_can_image.w / 2, game.SH - 20 - zombie_seed_image.h - watering_can_image.h/2 - 20);
			game.ui.watering_can.alive = true;
			game.ui.watering_can.toggle = true;
			game.ui.watering_can.clr = "#5F97EA";
			game.ui.watering_can.toggle = true;
			game.ui.watering_can.tick = function() {
				let sq = this;
				sq.y = game.SH - 20 - zombie_seed_image.h - watering_can_image.h/2 - 20;
				sq_tick(this);
			}

			music = sq_getSound("music/under_the_moonrise.mp3");
			music._loop = true;
			music.play();
			music.volume(0.2);

			game.fonts.system = sq_getFont( "Arial", 26, "#abc" );
			game.fonts.seed = sq_getFont( "Arial", 26, "#FF0" );

			game.water_drop_img = sq_getImage("img/water_drop_red.png");
			game.harvest_img = sq_getImage("img/harvest.png");

			// --------------------------
			// GENERATE BG SQUIDS 
			// --------------------------
			game.cacti = [];
			let cacti_image = sq_getImage("img/cactus.png");
			let tree_image = sq_getImage("img/tree.png");


			for(let i = 0; i <= 10; i++) {
				let flipper = Math.floor(Math.random() * 2);
				let sq = sq_create(tree_image, (Math.random()) * game.SW, (Math.random()) * game.SH);
				sq.alive = true;
				let scale = 2;
				sq.sx = scale;
				sq.sy = scale; 
				sq.wave_direction = {x: 1, y: 1}
				sq.tick = function() {
					let z = this;
					if(z.sx >= scale + 0.02) {
						z.wave_direction.x = -1;
					}
					if(z.sx <= scale - 0.02) {
						z.wave_direction.x = 1;
					}
					if(z.sy >= scale + 0.02) {
						z.wave_direction.y = -1;
					}
					if(z.sy <= scale - 0.02) {
						z.wave_direction.y = 1;
					}
					if(game.t % 5 === 0) {
						z.sx += Math.random() / 100 * z.wave_direction.x;
					}
					if(game.t % 25 === 0) {
						z.sy += Math.random() / i / 10 * z.wave_direction.y;
					}
				}

				game.cacti.push(sq);
			}

			window.requestAnimationFrame(game.loop);
		});
	}
}

document.addEventListener("DOMContentLoaded", e => {
	game.init();
});




app_keyup = function(key) {
	game.keys_down[key] = 0;
}
app_keydown = function(key) {
	game.keys_down[key] = 1;
}
var game = {
	t: 0,
	SW: 800,
	SH: 600,
	images: ["rt.png", "zombie-ripe.png"],
	sounds: ["rt.wav", "dumb.wav"],
	fonts: {
		system: null
	},
	player: null,
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
						game.player.tgty += 1;
						break;
					case 's':
						game.player.tgty -= 1;
						break;
				 	case 'a':
						game.player.tgtx -= 1;
						break;
					case 'd':
						game.player.tgtx += 1;
						break;
					default: break;
				}
			}
		});

		game.player.tick();
	},
	draw: function() {
		sq_fillRect(0,0,game.SW, game.SH, "#000");
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
			sq_useCanvas("mycanvas", game.SW, game.SH);

			player = sq_create(sq_getImage("rt.png"), 100, 100);
			player.alive = true;

			player.tick = function() {
				let sq = this;
				this.vx = (this.tgtx - this.x) * 0.2;
				this.vy = (this.tgty - this.y) * 0.2;
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

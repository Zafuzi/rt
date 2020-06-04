var gamepad = new Gamepad();
var btns_down = {};

gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
	// a new gamepad connected
});

gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
	// gamepad disconnected
});

gamepad.bind(Gamepad.Event.UNSUPPORTED, function(device) {
	// an unsupported gamepad connected (add new mapping)
});

gamepad.bind(Gamepad.Event.BUTTON_DOWN, function(e) {
	// e.control of gamepad e.gamepad pressed down
	btns_down[e.control] = true;
});

gamepad.bind(Gamepad.Event.BUTTON_UP, function(e) {
	// e.control of gamepad e.gamepad released
	log(e.control);
	btns_down[e.control] = true;
});

gamepad.bind(Gamepad.Event.AXIS_CHANGED, function(e) {
	// e.axis changed to value e.value for gamepad e.gamepad
});

gamepad.bind(Gamepad.Event.TICK, function(gamepads) {
	// gamepads were updated (around 60 times a second)
	log(btns_down);
});

if (!gamepad.init()) {
	// Your browser does not support gamepads, get the latest Google Chrome or Firefox
	log("CONTROLLERS NOT SUPPORTED");
}

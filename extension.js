const GLib = imports.gi.GLib;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Main = imports.ui.main;
const Cinnamon = imports.gi.Cinnamon;
const GObject = imports.gi.GObject;
const Atspi = imports.gi.Atspi;
const Clutter = imports.gi.Clutter;

let stage_handler_id;
let stage = new Clutter.Stage();
let listener;

let scrollInitWin;
let scrollModeTick;
let scrollMode = false;
let scrollCenterX = 0;
let scrollCenterY = 0;
let scrollIcon;
let scrollIconActor = null;

const settingsObj = {
	scrollPeriod: 50,
	deadzone: 20,
    iconSize: 64,
    disabledList: ["Godot","Krita"]
};

function debug_beep(){
	GLib.spawn_command_line_async('ffplay -f lavfi -i "sine=frequency=1000:duration=0.2" -autoexit -nodisp')
}

/**
 * called when extension is loaded
 */
function init(extensionMeta) {
  //extensionMeta holds your metadata.json info
    scrollIcon = Gio.icon_new_for_string(`${extensionMeta.path}/scroll_cursor.svg`);
}

/**
 * called when extension is loaded
 */
function enable() {

	//debug_beep()
	global.log("Enabling extension")
	listener = Atspi.EventListener.new((event)=>{
		switch(event.type){
			case "mouse:button:2p":
				middle_press(event);
				break;
			case "mouse:button:2r":
				middle_release(event);
				break;
		}
	});
    scrollModeTick = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, handle_scrollMode);
	
	listener.register("mouse:button:2p");
	listener.register("mouse:button:2r");
}	

function dumpObj(o)
{
    global.log(o)
    global.log(Object.keys(o))
}
function handle_scrollMode() {
	if(!scrollMode) return GLib.SOURCE_CONTINUE;

	let [x, y, _] = global.get_pointer();
	
	let deltaY = y-scrollCenterY;
    let deltaX = x-scrollCenterX;
    let floatMax = -1;
    //Vert Scroll
	if(Math.abs(deltaY) >= settingsObj.deadzone){
        let xdoDir = deltaY > 0 ? '5' : '4'
        let repeatsFloat = Math.max(1,Math.min(9,Math.abs(deltaY / settingsObj.scrollPeriod)))
        if(repeatsFloat > floatMax) floatMax = repeatsFloat;
        let repeats = Math.floor(repeatsFloat)
	    GLib.spawn_command_line_async('xdotool click --delay=10 --repeat ' + repeats.toString() + ' ' + xdoDir)
    }

    //Hor Scroll
	if(Math.abs(deltaX) >= settingsObj.deadzone){
        let xdoDir = deltaX > 0 ? '7' : '6'
        let repeatsFloat = Math.max(1,Math.min(9,Math.abs(deltaX / settingsObj.scrollPeriod)))
        if(repeatsFloat > floatMax) floatMax = repeatsFloat;
        let repeats = Math.floor(repeatsFloat)
	    GLib.spawn_command_line_async('xdotool click --delay=10 --repeat ' + repeats.toString() + ' ' + xdoDir)
    }
    if(scrollIconActor != null && floatMax > 0){
        let newSz = settingsObj.iconSize * (1+floatMax/9.0);
        scrollIconActor.set_position(scrollCenterX - (newSz / 2), scrollCenterY - (newSz / 2));
        scrollIconActor.set_icon_size(newSz)
    }
    return GLib.SOURCE_CONTINUE;
}

function focusedWindowApp(){
    const windowTracker = Cinnamon.WindowTracker.get_default();
    const name = windowTracker.get_window_app(global.display.focus_window).get_name();
    return name;
}

function middle_press(event) {
    scrollInitWin = focusedWindowApp()
    if(settingsObj.disabledList.includes(scrollInitWin)) return;
	let [x, y, _] = global.get_pointer();
	scrollCenterX = x;
	scrollCenterY = y;
	scrollMode = true;

    scrollIconActor = new St.Icon({
            x: scrollCenterX - (settingsObj.iconSize / 2),
            y: scrollCenterY - (settingsObj.iconSize / 2),
            reactive: false,
            can_focus: false,
            track_hover: false,
            icon_size: settingsObj.iconSize,
            gicon: scrollIcon,
        });
    Main.uiGroup.add_child(scrollIconActor);
}

function middle_release(event){
	scrollMode = false;
    Main.uiGroup.remove_child(scrollIconActor);
    scrollIconActor = null;
}

/**
 * called when extension gets disabled
 */
function disable() {
	global.log("Disabling extension")
	listener.deregister("mouse:button:2p")
	listener.deregister("mouse:button:2r")
	GLib.source_remove(scrollModeTick);
    if(scrollIconActor != null)
        Main.uiGroup.remove_child(scrollIconActor);
	
}

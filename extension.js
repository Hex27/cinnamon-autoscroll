const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Main = imports.ui.main;
const Cinnamon = imports.gi.Cinnamon;
const Atspi = imports.gi.Atspi;
const Settings = imports.ui.settings;

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
    disabledList: []
};

function init(extensionMeta) {
    scrollIcon = Gio.icon_new_for_string(`${extensionMeta.path}/scroll_cursor.svg`);
}

/**
 * called when extension is loaded
 */
function enable() {
    let settings = new Settings.ExtensionSettings(settingsObj, "autoscroll@hex27")
    settings.bind("scrollPeriod","scrollPeriod",(val)=>settingsObj.scrollPeriod=val)
    settings.bind("deadzone","deadzone",(val)=>settingsObj.deadzone=val)
    settings.bind("iconSize","iconSize",(val)=>settingsObj.iconSize=val)
    settings.bind("disabledList","disabledList",(val)=>settingsObj.disabledList=val)

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
        scrollIconActor.set_position(scrollCenterX - (newSz / 2.0), scrollCenterY - (newSz / 2.0));
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
    for(let disabledIdx=0; disabledIdx < settingsObj.disabledList.length; disabledIdx++){
        if(settingsObj.disabledList[disabledIdx].app === scrollInitWin) return;
    }
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
    global.log(settingsObj)
}

/**
 * called when extension gets disabled
 */
function disable() {
	listener.deregister("mouse:button:2p")
	listener.deregister("mouse:button:2r")
	GLib.source_remove(scrollModeTick);
    if(scrollIconActor != null)
        Main.uiGroup.remove_child(scrollIconActor);
	
}

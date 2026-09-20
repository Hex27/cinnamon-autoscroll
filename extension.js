const GLib = imports.gi.GLib;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Atspi = imports.gi.Atspi;
const Clutter = imports.gi.Clutter;

let stage_handler_id;
let stage = new Clutter.Stage();
let listener;

let scrollMode = false;
let scrollCenterX = 0;
let scrollCenterY = 0;
const settingsObj = {
	scrollPeriod: 20,
	deadzone: 20,
};

function debug_beep(){
	GLib.spawn_command_line_async('ffplay -f lavfi -i "sine=frequency=1000:duration=0.2" -autoexit -nodisp')
}

/**
 * called when extension is loaded
 */
function init(extensionMeta) {
  //extensionMeta holds your metadata.json info

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
			case "mouse:abs":
				handle_scrollMode(event);
				break;
		}
	});
	
	listener.register("mouse:button:2p");
	listener.register("mouse:button:2r");
	listener.register("mouse:abs");	
}	

function dumpObj(o)
{
    global.log(o)
    global.log(Object.keys(o))
}
function handle_scrollMode(event) {
	
	if(!scrollMode) return;
    let display = Gdk.Display.get_default();
    dumpObj(display)
    let windows = Gdk.Screen.get_default().get_window_stack();    
    let window = windows[windows.length-1] 
    //let [window,winx,winy] = display.get_window_at_pointer();
        global.log("WINDOWS")  
    for(let wid in windows){      
        global.log(wid,windows[wid])
    }
        global.log("E-WINDOWS")  
	let [x, y, _] = global.get_pointer();
	
	let deltaY = y-scrollCenterY;
	if(Math.abs(deltaY) < settingsObj.deadzone) return;

    window.scroll(0,deltaY)
    /*
	// 1. Create a raw Scroll Event
    let scrollEvent = Gdk.Event.new(Gdk.EventType.SCROLL);

    // 3. Populate mandatory event fields
    //scrollEvent.window = window;
    scrollEvent.direction = deltaY > 0 ? Gdk.ScrollDirection.DOWN : Gdk.ScrollDirection.UP;
    //scrollEvent.send_event = 1; // Mark as explicitly synthesized/sent
    //scrollEvent.time = Gtk.get_current_event_time();
    // 4. Set relative pointer coordinates (use center of the window if unknown)
    //scrollEvent.x = scrollCenterX;
    //scrollEvent.y = scrollCenterY;

    // 5. Get absolute root coordinates matching your screen space
    //let [discard, rootX, rootY] = scrollEvent.get_root_coords();
    //scrollEvent.x_root = rootX + scrollEvent.x;
    //scrollEvent.y_root = rootY + scrollEvent.y;
    global.log(window.get_user_data())
    // 6. Push the event into GTK's main loop event queue
    //global.log(deltaY)
    //display.put_event(scrollEvent);
    scrollEvent.put()
*/
}

function middle_press(event) {
	global.log("Press");
	scrollCenterX = event.detail1;
	scrollCenterY = event.detail2;
	scrollMode = true;
}

function middle_release(event){
	global.log("Release")
	scrollMode = false;
}

/**
 * called when extension gets disabled
 */
function disable() {
	global.log("Disabling extension")
	listener.deregister("mouse:button:2p")
	listener.deregister("mouse:button:2r")
	listener.deregister("mouse:abs")
	
}

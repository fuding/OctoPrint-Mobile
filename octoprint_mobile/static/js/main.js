$(document).ready(function() {
    applyBindings();
	switchView("loading_view");
	setup();
});

function setup(){
	checkHome(function(data){
		home = data.home;
		if ( home ) {
			// prevent scrolling
			document.ontouchmove = function(event){
			    return false;
			};
			
			connect();
		} else {
			// allow scrolling
			document.ontouchmove = function(event){
				return true;
			};
			start_camera(true);
		}
	});
}

$("#reconnect").click(function(){
	connect();
});

function start_camera(alone){
		d = new Date();
	if (alone) {
		switchView("camera_view");
		$("#webcam_alone").attr("src", "/webcam/?action=stream&"+d.getTime());
	} else {
		switchTab("camera_tab");
		$("#webcam").attr("src", "/webcam/?action=stream&"+d.getTime());
	}
}

function stop_camera(){
	window.stop();
}

function reload(){
	localStorage.clear();
	switchView("loading_view");
	location.reload();
}

//called by ios app 
function onForeground(){
	checkHome(function(data){
		var new_home = data.home;
		if ( new_home === home) { //didn't change location
			if ( ! new_home ) { //we're away 
				start_camera(true);
			} else {
				connect();
			}
		} else { //we moved in or out the house... reload the app
			home = new_home;		
			reload();
		}
	});
}

//called by ios app 
function onBackground(){
   switchView("disconnected_view");
   stop_camera();	
   disconnect();
}



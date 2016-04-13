$(document).ready(function() {
	switchView("loading");
	applyBindings();
	printer.previousFileToPrint(localStorage.getItem("previousFileToPrint"));
	
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
});

$("#reconnect").click(function(){
	connect();
});

function start_camera(alone){
	d = new Date();
	if (alone) {
		switchView("camera");
		$("#webcam_alone").attr("src", BASE_URL+"webcam/?action=stream&"+d.getTime());
	} else {
		switchPanel("camera");
		if (clearCameraTimeout()) {
			$("#webcam").attr("src", BASE_URL+"webcam/?action=stream&"+d.getTime());	
		} 
	}
}

function stop_camera(imediate){
	if (imediate) {
		clearCameraTimeout();
		window.stop();		
	} else {
		setCameraTimeout(); 
	}
}

var camera_timeout;

function clearCameraTimeout(){
	//console.log(camera_timeout);
	if (camera_timeout == undefined) return true;
	clearTimeout(camera_timeout);
	camera_timeout = undefined;
	//console.log("cleared");
	return false;
}

function setCameraTimeout(){
	//console.log("set");
	camera_timeout = setTimeout(function(){
		//console.log("triggered");
		camera_timeout = undefined; 
		window.stop();
	}, 30000); //stop after X seconds
} 

//called by ios app 
function onForeground(){
	checkHome(function(data){
		var new_home = data.home;
		if ( new_home == home) { //didn't change location
			if ( ! new_home ) { //we're away 
				start_camera(true);
			} else {
				connect();
			}
		} else { //we moved in or out the house... reload the app
			home = new_home;		
			location.reload();
		}
	});
}

//called by ios app 
function onBackground(){
	if (home) {
		disconnect();
	} else {
		stop_camera(true); //stop camera imediatly
	}
}



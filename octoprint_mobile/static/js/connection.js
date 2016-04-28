var socket;
var retry_count = 60;
var gcodes_offset;
var gcodes_action;

function connect(){
	disconnect()
	getGcodes();
	socket = new SockJS(BASE_URL+"sockjs/");
	
	socket.timeoutInterval = 5400;
	socket.maxReconnectAttempts = 10;
	
	socket.onopen = function() {
		switchView("main");
		sendSwitchCommand("status");
		retry_count = 60;
	};
	
	socket.onmessage = function(e) {
		if(currentView === "disconnected" || currentView === "loading" ){
			switchView("main");
		}
		onReceivedData(e.data);
	}; 
	
	socket.onclose = function(e) {
		if (e.code == 1000 ) { //{type: "close", code: 1000, reason: "Normal closure", wasClean: true}
			switchView("disconnected");
			stop_camera(true); //stop camera imediatly
		} else { //{type: "close", code: 1006, reason: "WebSocket connection broken", wasClean: false}
			protocol_error({status: 99, responseText:"Server is offline."})
		}
	};

}

function disconnect(){
	if (socket != undefined){
		socket.close();
	}
}


//conection commands
function sendConnectionCommand(command){
		$.ajax({
			url:  BASE_URL+"api/connection",
			headers: {"X-Api-Key": API_KEY},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify({"command": command})
		});
}

function getConnectionStatus(callback){
		$.ajax({
			url:  BASE_URL+"api/connection",
			headers: {"X-Api-Key": API_KEY},
			method: "GET",
			timeout: 10000,
			contentType: "application/json"
		}).done(function(data){if (typeof callback === "function") callback(data);});
}

//files commands
function sendLoadFile(filename){
		$.ajax({
			url:  BASE_URL+"api/files/local/"+filename,
			headers: {"X-Api-Key": API_KEY},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify({"command": "select"})
		});
}

function getGcodeFiles(callback){
		$.ajax({
			url:  BASE_URL+"api/files",
			headers: {"X-Api-Key": API_KEY},
			method: "GET",
			timeout: 10000,
			contentType: "application/json",
		}).done(function(data){console.log(callback);if (typeof callback === "function") callback(data);});
}

//job commands
function sendJobCommand(command){
		$.ajax({
			url:  BASE_URL+"api/job",
			headers: {"X-Api-Key": API_KEY},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify({"command": command})
		});
}

function sendCommandByName(name){
	var gcode = gcodes_action[name];
	if (gcode != undefined) {
		sendCommand( gcode.split(",") );
	}
}

//G or M codes
function sendCommand(data){
	if (typeof data  === "string") {
		command = {"command": data};
	} else {
		command = {"commands": data};
	}
	$.ajax({
		url:  BASE_URL+"api/printer/command",
		headers: {"X-Api-Key": API_KEY},
		method: "POST",
		timeout: 10000,
		contentType: "application/json",
		data: JSON.stringify(command)
	});
}

//switch plugin
function sendSwitch(data, callback){
	if (has_switch()) {
		$.ajax({
			url:  BASE_URL+"api/plugin/switch",
			headers: {"X-Api-Key": API_KEY},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify(data),
			
		}).done(function(){if (typeof callback === "function") callback();});
	}
}

function sendSwitchCommand(command, status){
	if (status != undefined){
		sendSwitch({"command":command, "status":status}, function(){sendSwitchCommand("status");});
	} else {
		sendSwitch({"command":command});
	}
}

//mobile plugin
function checkHome(callback){
	$.ajax({
		url:  MOBILE_URL+"/home",
		headers: {"X-Api-Key": API_KEY},
		method: "GET",
		timeout: 10000,
		contentType: "application/json",
		error: protocol_error
	}).done(function(data){if (typeof callback === "function") callback(data);});
}


function getGcodes(){
	$.ajax({
		url:  MOBILE_URL+"/gcodes/"+localStorage.getItem("gcodes.mobile.id"),
		headers: {"X-Api-Key": API_KEY},
		method: "GET",
		timeout: 10000,
		contentType: "application/json"
	}).done( function(data){
		if (typeof(data) === "string") {
			data = JSON.parse(data);
		}		
		if (data.update){
			localStorage.setItem("gcodes.mobile.id", data.id);
			gcodes_offset = data.offset;
			gcodes_action = data.action;
			localStorage.setItem("gcodes.mobile.offset", JSON.stringify(data.offset));
			localStorage.setItem("gcodes.mobile.action", JSON.stringify(data.action));
		} else {
			gcodes_offset = JSON.parse(localStorage.getItem("gcodes.mobile.offset"));
			gcodes_action = JSON.parse(localStorage.getItem("gcodes.mobile.action"));
		}
	});
}

function unselect(){
	$.ajax({
		url:  MOBILE_URL+"/unselect",
		headers: {"X-Api-Key": API_KEY},
		method: "GET",
		timeout: 10000,
		contentType: "application/json"
	});
}


//error handling
function protocol_error(reason) {
	$("#disconnected_message").text(reason.responseText);
	switchView("disconnected");
	if (socket != undefined){
		socket.close();
	}	
	if (reason.status == 99){
		if (retry_count > 0) {
			retry_count = retry_count - 1;
			setTimeout(function(){
				connect();
			}, 2000);
		}
	}
}

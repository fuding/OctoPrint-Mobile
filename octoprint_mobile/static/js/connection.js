var socket;
var retry_count = 50;

function connect(){
	disconnect()
	socket = new SockJS(BASE_URL+"sockjs/");
	
	socket.timeoutInterval = 5400;
	socket.maxReconnectAttempts = 10;
	
	socket.onopen = function() {
		switchView("main");
		getSwitchStatus();
		retry_count = 10;
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
function sendConnectionCommand(action){
		$.ajax({
			url:  BASE_URL+"api/connection",
			headers: {"X-Api-Key": API_KEY},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify({"command": action})
		});
}

//job commands
function sendJobCommand(action){
		$.ajax({
			url:  BASE_URL+"api/job",
			headers: {"X-Api-Key": API_KEY},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify({"command": action})
		});
}

//G or M codes
function sendCommand(data){
	if ( printer.acceptsCommands() ) {
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
}

//switch plugin
function sendSwitch(data, callback){
		$.ajax({
			url:  BASE_URL+"api/plugin/switch",
			headers: {"X-Api-Key": API_KEY},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify(data),
			
		}).done(function(){if (typeof callback === "function") callback();});
}

function getSwitchStatus(){
	sendSwitch({"command":"status"});
}

function sendSwitchCommand(command){
	sendSwitch(command, getSwitchStatus);
}

//mobile plugin
function checkHome(callback){
		return $.ajax({
			url:  BASE_URL+"api/"+MOBILE_URL,
			headers: {"X-Api-Key": API_KEY},
			method: "GET",
			timeout: 10000,
			contentType: "application/json",
			error: protocol_error
		}).done(function(data){if (typeof callback === "function") callback(data);});
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

var socket;

function disconnect(){
	if (socket != undefined){
		socket.close();
	}
}

function connect(){
	socket = new SockJS("/sockjs/");
	
	socket.timeoutInterval = 5400;
	socket.maxReconnectAttempts = 10;
	
	socket.onopen = function() {
		switchView("main");
		switchTab("info_tab");		
		getSwitchStatus();
	};
	
	socket.onmessage = function(e) {
		if(currentView === "disconnected_view" || currentView === "loading_view" ){
			switchView("main");
			switchTab("info_tab");
		}
		onReceivedData(e.data);
	}; 
	
	socket.onclose = function() {
	   switchView("disconnected_view");
	   window.stop();
	};
	
}

//job commands
function sendJobCommand(action){
		$.ajax({
			url:  "/api/job",
			headers: {"X-Api-Key": apikey},
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
			url:  "/api/printer/command",
			headers: {"X-Api-Key": apikey},
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
			url:  "/api/plugin/switch",
			headers: {"X-Api-Key": apikey},
			method: "POST",
			timeout: 10000,
			contentType: "application/json",
			data: JSON.stringify(data)
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
			url:  "/api/plugin/mobile",
			headers: {"X-Api-Key": apikey},
			method: "GET",
			timeout: 10000,
			contentType: "application/json"
		}).done(function(data){if (typeof callback === "function") callback(data);});
}


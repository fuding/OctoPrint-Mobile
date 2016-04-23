var color_on = "#17b566"; 
var color_off = "#ed2b36"; 

var re114 = /X:([+-]?[0-9.]+) Y:([+-]?[0-9.]+) Z:([+-]?[0-9.]+) E:([+-]?[0-9.]+)/;
var re851 = /echo:Z Offset : ([-.\d]*)/;

function onReceivedData(data){
	if (typeof(data) === "string") {
		data = JSON.parse(data);
	}
	//console.log(data);
	if(typeof(data.current) !== "undefined"){
		onCurrentData(data.current);
	} 
	
	if (typeof(data.history) !== "undefined"){
		onHistoryData(data.history);
	}
	
	if(typeof(data.event) !== "undefined"){
		onEventData(data.event.type, data.event.payload);
	}
	
	if(typeof(data.plugin) !== "undefined"){
		onPluginData(data.plugin.plugin, data.plugin.data);
	}
	
}

function onHistoryData(history){
 	//console.log(history);
 	printer.status(history.state.text);
	updateFlasgs(history.state.flags);
	//printer.status(payload.state_string);
	if (history.state.text == "Printing") {
		showProgress();		
	} else {
		hideProgress();
	}
}

function onCurrentData(current){
	// uppdate printer status
	//console.log(current);	
	printer.fileToPrint(current.job.file.name);

	updateFlasgs(current.state.flags);
	onMessageData(current.messages);
	
	if(typeof(current.temps[0]) !== "undefined"){
		printer.bed_actual(current.temps[0].bed.actual);
		printer.bed_target(current.temps[0].bed.target);
		printer.extruder_actual(current.temps[0].tool0.actual);
		printer.extruder_target(current.temps[0].tool0.target);
	} 
		
	if(current.state.flags.printing){
		printer.progress(parseInt(current.progress.completion));
		//console.log(formatSeconds(current.progress.printTimeLeft));
		if(current.progress.printTimeLeft != null){
			if (current.progress.printTimeLeft > 0) {
				printer.time_left(formatSeconds(current.progress.printTimeLeft));
			} else {
				printer.time_left(formatSeconds( current.progress.printTime * 100 / parseInt(current.progress.completion) - current.progress.printTime));
			}
		}
		printer.time_elapsed(formatSeconds(current.progress.printTime));
	}
	
	printer.status(current.state.text);
}

function updateFlasgs(flags){
	//whether the printer is currently connected and responding
	printer.operational(flags.operational);
	//whether the printer is currently printing>
	printer.printing(flags.printing);
	//whether the printer is currently disconnected and/or in an error state	
	printer.closedOrError(flags.closedOrError);
	//whether the printer is currently in an error state
	printer.error(flags.error);
	//whether the printer is currently paused
	printer.paused(flags.paused);
	//whether the printer is operational and ready for jobs
	printer.ready(flags.ready);
}

function onMessageData(messages){
	//console.log(currentPanel);
	if (currentPanel == "offset") {
		var m;
		if ((m = re851.exec(messages)) !== null) {
			//console.log(m);
			offset.offset(m[1]);
		} 
		if ((m = re114.exec(messages)) != null) {
			//console.log(m);
			offset.current_z(m[3]);
		}
	}
}

function onEventData(type, payload) {
	//console.log("Event '"+type + "': ", payload);
	switch (type) {
		case "PrinterStateChanged":
			printer.status(payload.state_string);
			if (payload.state_id == "PRINTING") {
				showProgress();
				printer.progress(0.1); 
			} else if (payload.state_id == "OFFLINE" || payload.state_id == "ERROR") {
				hideProgress()
			} else if (payload.state_id == "OPERATIONAL") {
				hideProgress();
			}
			break;
		case "Connected":
			printer.port(payload.port);
			break;
	}
}


function onPluginData(name, data){
	//console.log("Plugin '"+ name + "': ", data);
	switch (name) {
		 case "switch":
			printer.power(JSON.parse(data.power)); //convert to boolean
			printer.lights(JSON.parse(data.lights));
			printer.mute(JSON.parse(data.mute));
			printer.unload(JSON.parse(data.unload));
			printer.poweroff(JSON.parse(data.poweroff));
			break;
		case "mobile":
			message(data.message);
			break;
		case "status_line":
			message(data.status_line);
			break;
	}
}

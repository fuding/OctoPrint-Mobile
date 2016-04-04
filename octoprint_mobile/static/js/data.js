var color_on = "#17b566"; 
var color_off = "#ed2b36"; 

function onPluginData(name, data){
	//console.log("Plugin '"+ name + "': ", data);
	if(name === "switch") {
		printer.power = JSON.parse(data.power);
		printer.lights = JSON.parse(data.lights);
		printer.mute = JSON.parse(data.mute); 

		printer.isPower( printer.power ? color_on : color_off );
		printer.isLights( printer.lights ? color_on : color_off );
		printer.isMute( printer.mute ? color_off: color_on );
	}	
}
 
function onEventData(type, payload) {
	//console.log("Event '"+type + "': ", payload);
	if (event === "PrinterStateChanged") {
		printer.setStatus(payload.state_string);
	}
}

function onMessageData(messages){
	var re114 = /X:([+-]?[0-9.]+) Y:([+-]?[0-9.]+) Z:([+-]?[0-9.]+) E:([+-]?[0-9.]+)/;
	var re851 = /echo:Z Offset : (.*)/;
	var m;
	
	if ((m = re114.exec(messages)) !== null) {
		//console.log(m);
		offset.current_z(m[3]);
	}
	if ((m = re851.exec(messages)) !== null) {
		//console.log(m);
		offset.offset(m[1]);
	}

}

function onHistoryData(history){
	//console.log(history);
	printer.setStatus(history.state.text);
	printer.fileToPrint(history.job.file.name)
}

function onCurrentData(current){
	// uppdate printer status
	//console.log(current);
	printer.setStatus(current.state.text);
	printer.fileToPrint(current.job.file.name)

	onMessageData(current.messages);
	
	if(typeof(current.temps[0]) !== "undefined"){
		// update printer temps
		var bedTemp;
		if(typeof(current.temps[0].bed) !== "undefined" && current.temps[0].bed.actual !== null){
			if(current.temps[0].bed.target === 0){
				bedTemp = "<i class='fa fa-bed fa-fw'></i> "+current.temps[0].bed.actual + "ºC";
			}else {
				bedTemp = "<i class='fa fa-bed fa-fw'></i> "+current.temps[0].bed.actual + "ºC / " + current.temps[0].bed.target + "ºC";
			}
			$("#bed_temp").html(bedTemp);
		} 
		var e0Temp;
		if(typeof(current.temps[0].tool0) !== "undefined"){
			if(current.temps[0].tool0.target === 0){
				e0Temp = "<i class='fa fa-fire fa-fw'></i> "+current.temps[0].tool0.actual + "ºC";
			}else {
				e0Temp = "<i class='fa fa-fire fa-fw'></i> "+current.temps[0].tool0.actual + "ºC / " + current.temps[0].tool0.target + "ºC";
			}
			$("#extruder_temp").html(e0Temp);
		} 
	}
	
	if(current.state.flags.printing){
		// update print time info
		if(current.progress.printTimeLeft === null){
			$("#printing_time_left").text("Calculating...");
		}else {
			$("#printing_time_left").text(formatSeconds(current.progress.printTimeLeft));
		}
		$("#printing_time_elapsed").text(formatSeconds(current.progress.printTime));
		
		// update print progress bar
		printer.isPower("linear-gradient(90deg, #65C665 "+parseInt(current.progress.completion)+"%, #ed2b36 0%)");
	}
}

function onReceivedData(data){
	if (typeof(data) === "string") {
		data = JSON.parse(data);
	}
	//console.log(data);
		
	if (typeof(data.history) !== "undefined"){
		onHistoryData(data.history);
	}
	
	if(typeof(data.event) !== "undefined"){
		onEventData(data.event.type, data.event.payload);
	}
	
	if(typeof(data.plugin) !== "undefined"){
		onPluginData(data.plugin.plugin, data.plugin.data);
	}
	
	if(typeof(data.current) !== "undefined"){
		onCurrentData(data.current);
	}
}
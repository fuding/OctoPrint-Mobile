function ActionModel(){

	var self = this;
		
	self.extruder_slider_value = ko.observable(0);
	self.bed_slider_value = ko.observable(0);
	
	self.fan_slider_value = ko.observable(0);

	self.enable = ko.computed(function(){
		if (printer.acceptsCommands() && printer.power()){
			return true;
		} else {
			return false;
		}
	});
	
	self.canStartPrinting = ko.computed(function(){
		if (printer.operational() && printer.isFileLoaded() && ! (printer.printing() || printer.paused() )){
			return true;
		} else {
			return false;
		}
	});

	self.bed_temp = ko.computed(function(){
		if (printer.bed_target() == 0) {
			return sprintf(" %0.1fºC", printer.bed_actual());
		} else {
			return sprintf(" %0.1fºC / %0.1fºC", printer.bed_actual(),  printer.bed_target());
		}		
	});
	
	self.extruder_temp = ko.computed(function(){
		if (printer.extruder_target() == 0) {
			return sprintf(" %0.1fºC", printer.extruder_actual());
		} else {
			return sprintf(" %0.1fºC / %0.1fºC", printer.extruder_actual(),  printer.extruder_target());
		}
	});
	
	self.startPrint = function(){
		bootbox.confirm({ closeButton: false, message: "Start printing ?", callback: function(result) {
		  if (result) {
			sendJobCommand("start");
		  }
		}});
	}

	self.deselectFile = function(){
		unselect();
	}
	
	self.loadLatestFile = function(){
		getGcodeFiles(function(result){
			//console.log(_.last(_.sortBy(result.files, "date")).name);
			sendLoadFile(_.last(_.sortBy(result.files, "date")).name);
		});
	}

	self.pausePrint = function(){
		sendJobCommand("pause");
	}

	self.cancelPrint = function(){
		bootbox.confirm({ closeButton: false, message: "Cancel printing ?", callback: function(result) {
		  if (result) {
			sendJobCommand("cancel");
		  }
		}});
	}
	
	self.sendUp = function(){
		bootbox.confirm({ closeButton: false, message: "Send all the way up ?", callback: function(result) {
		  if (result) {
			  sendCommandByName('goto_z_max');
		  }
		}});
	}
	
	self.sendRelativeG1 = function(data){
		sendCommand(["G91", "G1 "+data, "G90"]);
	}

	self.sendAbsoluteG1 = function(data){
		sendCommand("G1 "+data);
	}
	
	self.sendBedTemperature = function(){
		if (self.bed_slider_value() == 0) {
			sendCommand(['M140 S0', 'M300 @beep']);
		} else {
			sendCommand(['M140 S'+self.bed_slider_value(), 'M300 @temperature_bed']);
			self.bed_slider_value(0);
			switchPanel("status");
		}
	}

	self.sendExtruderTemperature = function(){
		if (self.extruder_slider_value() == 0) {
			sendCommand(['M104 S0', 'M300 @beep']);
		} else {
			sendCommand(['M104 S'+self.extruder_slider_value(), 'M300 @temperature_extruder']);
			self.extruder_slider_value(0);
			switchPanel("status");
		}
	}
	
	self.setFanSpeed = function(){
		if (self.fan_slider_value() == 0) {
			sendCommand('M106 S0');
		} else {
			sendCommand('M106 S'+self.fan_slider_value());
			self.extruder_slider_value(0);
		}
	}
	
}

function OffsetModel() {
	
	var self = this;

	self.current_z = ko.observable();	
	self.offset = ko.observable();
		
	self.prepared = ko.observable(false);
	
	self.update = function(){
		if (!self.prepared()) {
			self.current_z("");	
			self.offset("");
			sendCommand(["M114", "M851"]);
		}
	}

	self.prepareOffset = function(){
		sendCommand( make_array( gcodes_offset.prepare_offset ) );
		self.prepared(true);
	}
	
	self.saveOffset = function(){
		sendCommand( make_array( gcodes_offset.save_offset.replace("{{z}}", self.current_z()) ) );
		self.prepared(false);
	}

	self.offsetTest = function(){
		sendCommand( make_array( gcodes_offset.offset_test ) );
	}

	self.offsetDone = function(){
		sendCommand( make_array( gcodes_offset.offset_done ) );
	}
	
	self.findZero = function(){
		sendCommand( make_array( gcodes_offset.find_reference ) );
	}

	self.backLeft = function(){
		sendCommand( make_array( gcodes_offset.back_left ) );
	}

	self.frontMiddle = function(){
		sendCommand( make_array( gcodes_offset.front_middle ) );
	}

	self.backRight = function(){
		sendCommand( make_array( gcodes_offset.back_right ) );
	}
	
	self.sendOffsetAdjustment = function(z){
		if (self.prepared()){
			sendCommand( make_array(  gcodes_offset.send_relative_z.replace("{{z}}", z) ) );
		} else {
			sendCommand( make_array( gcodes_offset.save_offset.replace("{{z}}", (parseFloat(self.offset()) + parseFloat(z)) ) ) 
			.concat( make_array(  gcodes_offset.send_relative_z.replace("{{z}}", z) ) ) );
		}
	}
	
}


function PrinterModel(){
	var self = this;
	
	self.port = ko.observable("");
	self.version = ko.observable("");
	self.status =  ko.observable("Offline");	
	
	self.progress = ko.observable(0);
	self.time_elapsed = ko.observable("00:00:00");
	self.time_left =  ko.observable("Calculating...");
	
	self.power = ko.observable();
	self.lights = ko.observable(null);
	self.mute = ko.observable(null);
	self.unload = ko.observable(null);
	self.poweroff = ko.observable(null);
	
	//whether the printer is currently connected and responding
	self.operational = ko.observable(null);
	//whether the printer is currently printing>
	self.printing = ko.observable(null);
	//whether the printer is currently disconnected and/or in an error state	
	self.closedOrError = ko.observable(null);
	//whether the printer is currently in an error state
	self.error = ko.observable(null);
	//whether the printer is currently paused
	self.paused = ko.observable(null);
	//whether the printer is operational and ready for jobs
	self.ready = ko.observable(null);


	self.bed_actual = ko.observable(0);
	self.bed_target = ko.observable(0);
	self.extruder_actual = ko.observable(0);
	self.extruder_target = ko.observable(0);
	
	self.fileToPrint = ko.observable(null);
	
	self.isFileLoaded = ko.computed(function(){
		if ( self.fileToPrint() == null){
			return false;
		} else {
			return true;
		}
	});
		
	self.acceptsCommands = ko.computed(function(){
		if (!self.power()) return false;
		if ( self.printing() || self.paused() ){
			return false;
		} else {
			if (self.ready() ) {
				return true;
			} else {
				return false;
			}
		}
	});

	self.alwaysAcceptsCommands = ko.computed(function(){
		if ( self.power() && self.ready() ) {
			return true;
		} else {
			return false;
		}
	});
	
	self.showProgress = ko.computed(function(){
		if ( self.printing() || self.paused() ){
			return true;
		} else {
			return false;
		}
	});
	
	self.showProgress.subscribe(function(value) {
		if (value) {
			$(".status_bar").css({"height": "20vh", "line-height": "20vh"});
			printer.progress(0.1); //make sure the colors change
		} else {
			$(".status_bar").css({"height": "33.34vh", "line-height": "33.34vh"});
			$("#printing_time_left").text("");
			$("#printing_time_elapsed").text("");	
			printer.bed_actual(0);
			printer.extruder_actual(0);
			printer.progress(0);
		}
	});
	
	//hack to enable/disable sliders
	self.acceptsCommands.subscribe(function(value) {
		if (value) {
			$("input.temp_slider").slider('enable');
		} else {
			$("input.temp_slider").slider('disable');
			action.extruder_slider_value(0);
			action.bed_slider_value(0);
			if (currentPanel == 'movement' || currentPanel == 'offset') switchPanel("status");
		}
	});
	
	self.alwaysAcceptsCommands.subscribe(function(value) {
		if (value) {
			$("input.fan_slider").slider('enable');
		} else {
			$("input.fan_slider").slider('disable');
			action.fan_slider_value(0);
		}
	});
	

	//switches ====================
	self.toggleLights = function(){
		sendSwitchCommand("lights",!self.lights());
	}

	self.togglePower = function(){
		sendSwitchCommand("power",!self.power());
	}

	self.toggleUnload = function(){
		sendSwitchCommand("unload",!self.unload());
	}

	self.togglePowerOff = function(){
		sendSwitchCommand("poweroff",!self.poweroff());
	}

	self.resetPrinter = function(){
		bootbox.confirm({closeButton: false, message: "Reset printer board?", callback: function(result) {
		  if (result) {
			sendSwitchCommand("reset");
			switchPanel("status");
		  }
		}});
	}

	self.toggleMute = function (){
		sendSwitchCommand("mute",!self.mute());
	}
	
	self.printerConnect = function(){
		sendConnectionCommand("connect");
		switchPanel("status");
	}

	self.printerDisconnect = function (){
		bootbox.confirm({closeButton: false, message: "Disconnect?", callback: function(result) {
		  if (result) {
			sendConnectionCommand("disconnect");
		  }
		}});
	}
}

var printer;
var action;
var offset;

function applyBindings(){
	printer = new PrinterModel();
	offset = new OffsetModel();
	action = new ActionModel();

	ko.applyBindings(action, document.getElementById("status_panel"));
	ko.applyBindings(action, document.getElementById("printer_panel"));
	ko.applyBindings(action, document.getElementById("movement_panel"));
	ko.applyBindings(printer,document.getElementById("camera_panel"));
	ko.applyBindings(printer,document.getElementById("sidebar"));
	ko.applyBindings(offset, document.getElementById("offset_panel"));
	
}


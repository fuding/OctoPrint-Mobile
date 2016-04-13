function ActionModel(){
	var self = this;

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
	
	self.homeAll = function(){
		sendCommand("G28");
	}
	
	self.autoLevel = function(){
		sendCommand("G29");
	}
	
	self.loadFilament = function(){
		sendCommand(["M80","G92 E0","G1 E680 F3000","G92 E0","M300 @beep"]);
	}
	
	self.unloadFilament = function(){
		sendCommand(["M80","G92 E0","G1 E-680 F3000","G92 E0","M300 @beep"]);
	}
	
	self.startPrint = function(){
		bootbox.confirm({ closeButton: false, message: "Start printing ?", callback: function(result) {
		  if (result) {
			sendJobCommand("start");
		  }
		}});
	}

	self.coolOff = function(){
		sendCommand(["M140 S0", "M104 S0", "M300 @beep"]);
	}

	self.fansOn = function(){
		sendCommand("M106 S255");
	}

	self.fansOff = function(){
		sendCommand("M106 S0");
	}

	self.motorsOff = function(){
		sendCommand("M18");
	}
	
	self.gotoCenter = function(){
		sendCommand("G1 X97.5 Y95 F6000");
	}
	
	self.loadLastFile = function(){
		sendReloadFile(printer.previousFileToPrint());
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
	
	self.sendRelativeG1 = function(data){
		sendCommand(["G91", "G1 "+data, "G90"]);
	}

	self.sendAbsoluteG1 = function(data){
		sendCommand("G1 "+data);
	}
	
}

function OffsetModel() {
	
	var self = this;

	self.current_z = ko.observable();	
	self.offset = ko.observable();
	
	self.enable = ko.computed(function(){
		if (printer.acceptsCommands() && printer.power()){
			return true;
		} else {
			return false;
		}
	});
	
	
	self.prepared = ko.observable(false);

	self.canPrepare = ko.computed(function(){
		if (self.enable() && !self.prepared()){
			return true;
		} else {
			return false;
		}
	});

	self.canSave = ko.computed(function(){
		if (self.enable() && self.prepared()){
			return true;
		} else {
			return false;
		}
	});
	
	self.update = function(){
		if (!self.prepared()) {
			self.current_z("");	
			self.offset("");
			sendCommand(["M114", "M851"]);
		}
	}

	self.prepareOffset = function(){
		sendCommand(["M503", "G28 XY", "G1 X64 Y15 F6000", "M851 Z0", "G28 Z", "M851 Z-10", "G1 X100 Y15 F6000", "M300 @beep"]);
		self.prepared(true);
	}
	
	self.saveOffset = function(){
		sendCommand(["M851 Z"+self.current_z(), "M500", "M851", "M300 @beep2"]);
		self.prepared(false);
	}

	self.offsetTest = function(){
		sendCommand(["G1 Z10 F300", "G1 X90 Y25 F6000", "G1 X110 Y25", "G1 X100 Y15", "G28 Z", "G30", "G1 Z0.2", "M114"]);
	}

	self.offsetDone = function(){
		sendCommand(["G1 Z5 F6000", "G1 X0 Y0"]);
	}
	
	self.findZero = function(){
		sendCommand(["G1 Z5", "G28", "G1 X105 Y9 F5000","G1 Z0"]);
	}

	self.backLeft = function(){
		sendCommand(["G1 Z5", "G1 X10 Y205 F5000","G1 Z0"]);
	}

	self.frontMiddle = function(){
		sendCommand(["G1 Z5", "G1 X105 Y9 F5000","G1 Z0"]);
	}

	self.backRight = function(){
		sendCommand(["G1 Z5","G1 X190 Y205 F5000","G1 Z0"]);
	}
	
	self.sendRelativeZ = function(z){
		sendCommand(["G91", "G1 Z"+z, "M114", "G90"]);
	}

}


function PrinterModel(){
	var self = this;

	self.power = ko.observable(false);
	self.lights = ko.observable(false);
	self.mute = ko.observable(false);
	
	//whether the printer is currently connected and responding
	self.operational = ko.observable(false);
	//whether the printer is currently printing>
	self.printing = ko.observable(false);
	//whether the printer is currently disconnected and/or in an error state	
	self.closedOrError = ko.observable(false);
	//whether the printer is currently in an error state
	self.error = ko.observable(false);
	//whether the printer is currently paused
	self.paused = ko.observable(false);
	//whether the printer is operational and ready for jobs
	self.ready = ko.observable(false);

	self.fileToPrint = ko.observable(null);
	
	self.previousFileToPrint = ko.observable(null);
	
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

	self.status =  ko.observable();	

	self.setStatus = function(value){
		self.status(value);
		
		if (value == "Printing") {
			$(".status_bar").css("height", "20vh");
			$(".status_bar").css("line-height", "20vh");
			$("#printing_time_left").show()
			$("#printing_time_elapsed").show()
		}
		if (value == "Offline" || value == "Error") {
			$(".status_bar").css("height", "33.34vh");
			$(".status_bar").css("line-height", "33.34vh");
			$("#bed_temp").html("&nbsp;");
			$("#extruder_temp").html("&nbsp;");
		}
		if (value == "Operational") {
			$("#printing_time_left").hide()
			$("#printing_time_elapsed").hide()
			$("#printing_time_left").text("");
			$("#printing_time_elapsed").text("");
			$(".status_bar").css("height", "33.34vh");
			$(".status_bar").css("line-height", "33.34vh");
			self.isPower( self.power() ? color_on : color_off );
		}
	}

	//switches ====================
	self.isPower = ko.observable();
	self.isLights = ko.observable();
	self.isMute = ko.observable();

	self.toggleLights = function(){
		sendSwitchCommand({"command":"lights","status":!self.lights()});
	}

	self.togglePower = function(){
		sendSwitchCommand({"command":"power","status":!self.power()});
	}

	self.resetPrinter = function(){
		bootbox.confirm({closeButton: false, message: "Reset printer board?", callback: function(result) {
		  if (result) {
			sendSwitch({"command":"reset"});
		  }
		}});
	}

	self.toggleMute = function (){
		sendSwitchCommand({"command":"mute","status":!self.mute()});
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
	ko.applyBindings(printer, document.getElementById("camera_panel"));
	ko.applyBindings(offset, document.getElementById("offset_panel"));
}


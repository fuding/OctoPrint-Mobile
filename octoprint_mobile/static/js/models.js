function OffsetModel(printer) {
	
	var self = this;
	self.printer = printer;

	self.current_z = ko.observable();	
	self.offset = ko.observable();
	
	self.prepared = ko.observable();
	
	self.enable = printer.acceptsCommands;
	
	self.canPrepare = ko.computed(function(){
		if (self.printer.acceptsCommands() && !self.prepared()){
			return true;
		} else {
			return false;
		}
	});

	self.canSave = ko.computed(function(){
		if (self.printer.acceptsCommands() && self.prepared()){
			return true;
		} else {
			return false;
		}
	});
	
	self.reset = function(){
		if (!self.prepared()) {
			sendCommand(["M114", "M851"]);
		}
	}

	self.prepareOffset = function(){
		self.prepared(true);
		sendCommand(["M503", "G28 XY", "G1 X64 Y15 F6000", "M851 Z0", "G28 Z", "M851 Z-10", "G1 X100 Y15 F6000", "M300 @beep"]);
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
	
	self.sendRelativeG = function(z){
		sendCommand(["G91", "G1 Z"+z, "M114", "G90"]);
	}
}

function ActionModel(printer){
	var self = this;
	
	self.printer = printer;
	
	self.enable = printer.acceptsCommands;
	self.available = printer.isAvailable;
	
	self.canCancel = ko.computed(function(){
		if (self.printer.isPrinting() || self.printer.isPaused() ){
			return true;
		} else {
			return false;
		}
	});
	
	self.canPrint = ko.computed(function(){
		if (self.available() && self.printer.isFileLoaded() && ! (self.printer.isPrinting() || self.printer.isPaused() )){
			return true;
		} else {
			return false;
		}
	});
	
	self.showPause = ko.computed(function(){
		if (self.printer.isPaused()){
			return false;
		} else {
			return true;
		}
	});
	
	self.showResume = ko.computed(function(){
		if (self.printer.isPaused() ){
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
		if (confirm("Start printing ?") == true) {
			sendJobCommand("start");
		}
	}

	self.pausePrint = function(){
		sendJobCommand("pause");
	}

	self.cancelPrint = function(){
		if (confirm("Cancel printing ?") == true) {
		    sendJobCommand("cancel");
		} 
	}

}

function PrinterModel(){
	var self = this;

	self.power = false;
	self.lights = false;
	self.mute = false;
	
	self.isPrinting = ko.observable();
	self.isPaused = ko.observable();
	self.isAvailable = ko.observable();
	
	self.fileToPrint = ko.observable(null);
	
	self.isFileLoaded = ko.computed(function(){
		if ( self.fileToPrint() == null){
			return false;
		} else {
			return true;
		}
	});
	
	self.acceptsCommands = ko.computed(function(){
		if ( self.isPrinting() || self.isPaused() ){
			return false;
		} else {
			if (self.isAvailable() ) {
				return true;
			} else {
				return false;
			}
		}
	});

    self.isPower = ko.observable();
	self.isLights = ko.observable();
	self.isMute = ko.observable();
	
	self.status =  ko.observable();

	self.toggleLights = function(){
		sendSwitchCommand({"command":"lights","status":!self.lights});
	}

	self.togglePower = function(){
		sendSwitchCommand({"command":"power","status":!self.power});
	}

	self.toggleMute = function (){
		sendSwitchCommand({"command":"mute","status":!self.mute});
	}
	
	self.setStatus = function(value){
		self.status(value);
		
		if (value == "Printing") {
			$(".info-bar").css("height", "20vh");
			$(".info-bar").css("line-height", "20vh");
			$("#printing_time_left").show()
			$("#printing_time_elapsed").show()
			self.isPrinting(true);
			self.isPaused(false);
			self.isAvailable(true);
		}
		if (value == "Paused") {
			self.isPrinting(false);
			self.isPaused(true);
			self.isAvailable(true);
		}
		if (value == "Offline" || value == "Error") {
			self.isPrinting(false);
			self.isPaused(false);
			self.isAvailable(false);
			 $("#bed_temp").html("&nbsp;");
			 $("#extruder_temp").html("&nbsp;");
		}
		if (value == "Operational") {
			self.isPrinting(false);
			self.isPaused(false);
			self.isAvailable(true);
			$("#printing_time_left").hide()
			$("#printing_time_elapsed").hide()
			$("#printing_time_left").text("");
			$("#printing_time_elapsed").text("");
			$(".info-bar").css("height", "33.34vh");
			$(".info-bar").css("line-height", "33.34vh");
			self.isPower( self.power ? color_on : color_off );
		}
	}

}

var printer;
var action;
var offset;

function applyBindings(){
	printer = new PrinterModel();
	offset = new OffsetModel(printer);
	action = new ActionModel(printer);

	$(".printer").each(function(){
		ko.applyBindings(printer, this);
	});
	ko.applyBindings(offset, document.getElementById("offset_tab"));
	ko.applyBindings(action, document.getElementById("printer_tab"));
}


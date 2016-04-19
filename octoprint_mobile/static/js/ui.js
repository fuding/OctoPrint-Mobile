var currentView;
var currentPanel;

function switchView(view) {
	if ( currentView != view ){
		if (view == "main") {
			switchPanel("status");
		}
		$(".view").hide();
		$("#"+view+"_view").show();
		currentView = view;
	}
}

function switchPanel(panel){
	if ( currentPanel != panel ){		

		$(".sidebar-nav-selected").removeClass("sidebar-nav-selected");
		$("#"+panel+"_btn").addClass("sidebar-nav-selected");

		$(".panel").hide();
		$("#"+panel+"_panel").show();
		
		if (currentPanel == "camera") {
			stop_camera(false); //stop streaming, but not imediate
		} 
		currentPanel = panel;
	}
}

function showProgress(){
	$(".status_bar").css("height", "20vh");
	$(".status_bar").css("line-height", "20vh");
	$("#printing_time_left").show()
	$("#printing_time_elapsed").show()
}

function hideProgress(){
	$("#printing_time_left").hide()
	$("#printing_time_elapsed").hide()
	$("#printing_time_left").text("");
	$("#printing_time_elapsed").text("");
	$(".status_bar").css("height", "33.34vh");
	$(".status_bar").css("line-height", "33.34vh");
	printer.bed_actual(0);
	printer.extruder_actual(0);
	printer.progress(0);
	if (currentPanel == 'movement' || currentPanel == 'offset') switchPanel("printer");
}

// tab menu buttons
$("#status_btn").click(function() {
	switchPanel("status");
});

$("#printer_btn").click(function() {
	switchPanel("printer");
});

$("#movement_btn").click(function() {
	if (printer.acceptsCommands()){
		switchPanel("movement");
	}
});

$("#offset_btn").click(function() {
	if (printer.acceptsCommands()){
		switchPanel("offset");
		offset.update(); //update z and z offset values
	}
});

$("#camera_btn").click(function() {
	start_camera();
});

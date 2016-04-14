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

// tab menu buttons
$("#status_btn").click(function() {
	switchPanel("status");
});

$("#printer_btn").click(function() {
	switchPanel("printer");
});

$("#movement_btn").click(function() {
	if (printer.power()){
		switchPanel("movement");
	}
});

$("#offset_btn").click(function() {
	if (printer.power()){
		switchPanel("offset");
		offset.update(); //update z and z offset values
	}
});

$("#camera_btn").click(function() {
	start_camera();
});

var currentView;
var currentTab;


function switchView(view) {
	if ( currentView != view ){
		
		currentView = view;
		
		// hide all the views
		$("#main").hide();
		$("#camera_view").hide();
		$("#disconnected_view").hide();
		$("#loading_view").hide();

		// show the desired view
		$("#"+view).show();
	}
}

function switchTab(tab){

	currentTab = tab;
	stop_camera(); 
	$("#info_tab_btn").removeClass("menu-tab-selected");
	$("#camera_tab_btn").removeClass("menu-tab-selected");
	$("#offset_tab_btn").removeClass("menu-tab-selected");
	$("#print_tab_btn").removeClass("menu-tab-selected");
	$("#settings_tab_btn").removeClass("menu-tab-selected");
	
	$("#info_tab").hide();
	$("#camera_tab").hide();
	$("#offset_tab").hide();
	$("#printer_tab").hide();
	$("#settings_tab").hide();

	$("#"+tab+"_btn").addClass("menu-tab-selected");
	$("#"+tab).show();
	
}

// tab menu buttons
$("#info_tab_btn").click(function() {
	switchTab("info_tab");
});

$("#camera_tab_btn").click(function() {
	start_camera();
});

$("#offset_tab_btn").click(function() {
	switchTab("offset_tab");
	offset.reset();
});

$("#print_tab_btn").click(function() {
	switchTab("printer_tab");
});

$("#settings_tab_btn").click(function() {
	switchTab("settings_tab");
});

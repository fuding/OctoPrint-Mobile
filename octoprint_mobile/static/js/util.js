function formatSeconds(s){
    var date = new Date(1970, 0, 1);
    date.setSeconds(s);
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function make_array(a){
	return _.map(a.replace(/\s\s+/g, ' ').split(","), _.trim);
}

function message(message){
	$.notify({message: message});
}

function formatSeconds(s){
    var date = new Date(1970, 0, 1);
    date.setSeconds(s);
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function message(message){
	$.notify({message: message});
}
const config = require("../../config.json");
const FocusModel = require("./../models/focus.model");


const days = ["Sunday","Monday", "Tuesday","Wednesday","Thursday","Friday","Saturday"];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


module.exports = {
    processFocus: function(command, message, args, dry=false){
	if (command === "focus"){
	    console.log("CMD   : FOCUS");
	    console.log("ARGS  : ", args);
	    if (args.length == 1){
		focus(message, args, dry);
	    } else {
		msg = "Valid options are `+focus [time]`";
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    return true;
	}
	return false;
    }
};

function setRole(user, name_role, message, date, dry){
    let role = message.guild.roles.find("name", name_role.trim());
    let roles = user.roles;
    roles = new Set(roles.keys());
    roles.add(role.id);
    msg = user.user.tag + " is now on Forced Productivity until " + formatDate(date) + ' (' + h_n_m((date - new Date())/60000) + ')';
    if(!dry){user.setRoles(Array.from(roles));}
    if(!dry){message.channel.send(msg);}
    if(!dry && (message.channel.name != "focus")){message.client.channels.find('name', "focus").send(msg);}
}


async function focus(message, args, dry){
    let msg = "";
    let usr = message.member;
    let time = parseInt(args[0]);
    if (!(isNaN(time))){
	if ((time <= config.maxTimeFocus) && (time > 0)){
	    let result = await setFocusOnTimed(usr, time, message, dry);
	    if (result != null){ // result == normal return value
		setRole(usr, "Focus", message, result.endDate, dry);
	    }
	} else {
	    msg = "you can't set focus for less than 1 minutes and for more than 10h (600)";
	    console.log("MSG   : ", msg)
	    if(!dry){message.channel.send(msg);}
	}
    } else {
	msg = "You need to provide a valid time (integer)";
	console.log("MSG   : ", msg)
	if(!dry){message.channel.send(msg);}
    }
}


async function setFocusOnTimed(usr, time, message, dry){
    let query = {id: usr.id},
	options = { upsert: true, new: true};
    let date = endDate(time);
    let result = null;
    try {
	result = await FocusModel.findOne(query);
	if (!((result != null) && (date < result.endDate))){
	    let updated = {id: usr.id, endDate: date};
	    result = await FocusModel.findOneAndUpdate(query, updated ,options);
	    console.log(result);
	    return result;
	} else {
	    if(!dry){message.channel.send("You cannot set a shorter focus time.")};
	    return null;
	}
    } catch(error){
	console.log("error updating in Focus", error);
	if(!dry){message.channel.send("We have a problem here. Contact the admin team.")};
	return null;
    }
}

function formatDate(date){
    return ('{date} {0} {1} {3} {4}:{5}:{6} UTC').replace('{date}', days[date.getDay()]).replace('{0}', date.getDate()).replace('{1}', months[date.getMonth()]).replace('{3}', date.getFullYear()).replace('{4}', date.getHours()).replace('{5}', date.getMinutes().toString().length == 1 ? '0'+date.getMinutes() : date.getMinutes()).replace('{6}', date.getSeconds().toString().length == 1 ? '0'+date.getSeconds() : date.getSeconds());
}

function h_n_m(minutes){
    minutes = Math.trunc(minutes);
    heures = Math.trunc(minutes / 60);
    minutes = minutes % 60;
    return heures + 'h ' + minutes + "m";  
}


function endDate(time){
    var actualDate = new Date();
    var newDate = new Date(actualDate.getTime() + (60000 * time));
    return newDate;
}

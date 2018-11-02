const config = require("../../config.json");
const _ = require("lodash");
const toggle = require("./tg.backend").toggleInternal;

module.exports = {
    processToggle: function(command, message, args, dry=false) {
	if (command === "tg") {
	    console.log("CMD   : TOGGLE")
	    console.log("ARGS  : ", args)
	    let roles =  message.member.roles
	    roles = new Set(roles.keys())
	    let mods = message.guild.roles.find("name", "Moderator").id
	    let admins = message.guild.roles.find("name", "Admins").id
	    permissions = false
	    if (roles.has(mods)||roles.has(admins)) {
		permissions = true
	    }
	    if (!permissions) {
		msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+tg`"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    else if (args.length >= 2) {
		toggle(args, message, dry);
	    } else {
		msg = "Valid options are `+tg [role] [username]`"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    return true
	}
	return false
    }
};


const config = require("../../config.json");
const adapted = require("./adapted.backend").adapt_to;




module.exports = {
    processAdapted: function(command, message, args, dry=false) {
	if (command === "adapted") {
	    console.log("CMD   : ADAPTED")
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
		msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+adapted`"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    else if (args.length >= 1) {
		adapted(args, message, dry);
	    } else {
		msg = "Valid options are `+adapted [schedule] [username]`"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    return true
	}
	return false
    }
};


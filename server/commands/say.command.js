const config = require("../../config.json");
const _ = require("lodash");

module.exports = {
	processSay: function(command, message, args, dry=false) {
		if (command === "say") {
			arg = message.content.slice(config.prefix.length+3,message.content.length).trim()
			console.log("CMD   : SAY")
			console.log("ARGS  : ", arg)
			let roles =  message.member.roles
			roles = new Set(roles.keys())
			let mods = message.guild.roles.find("name", "Moderator").id
			let admins = message.guild.roles.find("name", "Admins").id
			permissions = false
			if (roles.has(mods)||roles.has(admins)) {
				permissions = true
			}
			if (!permissions) {
				msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+mset`"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			else {
				console.log("ACT   : ", "Deleting user input message")
				message.delete().catch(O_o => {});
				console.log("MSG   : ", "Repriting user input")
				if(!dry){message.channel.send(arg);}
			}
			return true
		}
		return false
	}
};



const config = require("../../config.json");
const _ = require("lodash");

module.exports = {
	processTogglewatchgroup: function(command, message, args, dry=false) {
		if (command === "togglewatchgroup") {
			console.log("CMD   : TOGGLEWATCHGROUP")
			console.log("ARGS  : ", arg)

			let roles =  message.member.roles
			roles = new Set(roles.keys())
			nmorole = message.guild.roles.find("name", "NMO Watch Group").id
			if(roles.has(nmorole)) {
				roles.delete(nmorole)
				msg = message.author.tag + " has been removed from the NMO Watch Group."
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			} else {
				roles.add(nmorole)
				msg = message.author.tag + " has been added to the NMO Watch Group."
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			if(!dry){message.member.setRoles(Array.from(roles));}

			return true
		}
		return false
	}
};



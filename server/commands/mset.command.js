const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const mset = require("./mset.backend").msetInternal;

module.exports = {
	processMset: function(command, message, args, dry=false) {
		if (command === "mset") {
			let roles =  message.member.roles
			roles = new Set(roles.keys())
			let mods = message.guild.roles.find("name", "Moderators").id
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
			else if (args.length >= 3) {
				mset(args, message, dry);
			} else {
				msg = "Valid options are `+mset [schedule-name] [napchart-link] [username]`"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			return true
		}
		return false
	}
};

const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");

module.exports = {
	processSet: function(command, message, args, dry=false) {
		if (command === "get") {
			if (args.length <= 1) {
				get(args, message, dry);
			} else {
				//What?
				msg = "Valid options are `+get` or `+get userName` or `+get usertag#1234`"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			return true
		}
		return false
	}
};

async function get(args, message, dry) {
	let msg = "";

	let query = {};
	let searchable = "";
	if (args.length === 1) {
		let isTag = args[0].indexOf("#");
		query[isTag ? "userName" : "tag"] = args[0];
		searchable = args[0];
	} else if (args.length === 0) {
		query.tag = message.author.tag;
		searchable = message.author.tag;
	}
	message.guild.fetchMembers(args[0]).then((res)=>{
		m = res.members
		console.log("MSG   : ", m)
		console.log("MSG   : ", m.find("nickname",'Crimson [E2]'))
		console.log("MSG   : ", m.find("user.tag",args[0]))
		console.log("MSG   : ", m.find("user.username",args[0]))
	})


	let res;
	try {
		res = await UserModel.findOne(query);
	} catch (err) {
		console.warn("WARN  : ", "Could not get user: ", err);
	}

	if (res && res.currentScheduleChart) {
		let d = new Date(res.updatedAt);
		var n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');

		msg = `Napchart for **${res.tag}** (since ${n}):`
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
		getOrGenImg(res.currentScheduleChart, message, dry);
	} else {
		msg = `There is no napchart available for **${searchable}**`
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	}
}

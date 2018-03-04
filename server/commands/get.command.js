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
		}
	}
};

async function get(args, message) {
	let msg = "";

	let query = {};
	let searchable = "";
	if (args.length === 1) {
		let isTag = args[0].indexOf("#");
		query[isTag ? "tag" : "userName"] = args[0];
		searchable = args[0];
	} else if (args.length === 0) {
		query.tag = message.author.tag;
		searchable = message.author.tag;
	}

	let res;
	try {
		res = await UserModel.findOne(query);
	} catch (err) {
		console.warn("WARN  : ", "Could not get user: ", err);
	}

	if (res && res.currentScheduleChart) {
		let d = new Date(res.updatedAt);
		var n = d.toLocaleDateString();

		msg = `Napchart for ${res.tag} (since ${n}:)`
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
		getOrGenImg(res.currentScheduleChart, message, dry);
	} else {
			msg = `There is no napchart available for **${searchable}**`
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
	}
}

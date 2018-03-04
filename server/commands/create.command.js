const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl, createChart } = require("./../imageCache");

module.exports = {
	processCreate: function(command, message, args,dry=false) {
		if (command === "create") {
			if (args.length >= 1) {
				create(args, message, dry);
			} else {
				msg = "Type `+create` followed by a series of time ranges. For example, `+create 03:00-05:00 08:00-08:20 14:00-14:20 21:00-23:00`. A napchart link will then be generated for you. (If you want to set it, you will have to do that manually afterwards)"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
		}
	}
};

async function create(args, message) {
	let timeFrames = args.split(' ');

	let data = {};
	/*[{
		"start":720,
		"end": 790,
		"text": "Cool text"
	},{
		"start":1420,
		"end":400
	}]*/
	createChart(data)
}

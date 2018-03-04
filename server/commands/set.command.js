const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const schedules = require("./schedules");

const modifiers = [`shortened`, `extended`, `flipped`, `modified`, `recovery`];

module.exports = {
	processSet: function(command, message, args, dry=false) {
		if (command === "set") {
			if (args.length <= 2 && args.length > 0) {
				set(args, message, dry);

				//const sched = message.content.slice(config.prefix.length).trim().split(/ +/g);
				//if(args[0] ==
			} else {
				msg = "You need to provide a URL or a valid sleep cycle see +help for details."
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			return true;
		} else {
			return false;
		}
	}
};

async function set(args, message, dry) {
	let msg = "";
	let urlPossible = args.length === 2 ? args[1] : args[0];
	let schedulePossible = args[0]

	console.log("CMD   : SET")
	console.log("ARGS  : ", args)

	//DONE GET URL, GET User Name
	//TODO HANDLE doubles

	//If schedule only, wipe chart
	if (args[0] === "none") {
		console.log("ACT   : ", "Remove napchart from database for " +message.author.username)
		await saveUserSchedule(message, buildUserInstance());
		msg = "Nap Chart has been removed for " + message.author.tag + "."
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
		return;
	}

	var { is_nurl, nurl } = checkIsUrlAndGet(urlPossible);
	var { is_schedule, schedn, schedfull } = checkIsSchedule(schedulePossible);
	if (!is_nurl && !is_schedule) {
		msg = "Invalid `+set` format, use `+set [url]`, `+set [schedule]`, `+set [schedule] [url]` or see +help for details."
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
		console.error("ERR>>>: ", "Set command was rejected with args", args)
		return;
	}

	let userUpdate = buildUserInstance();

	let result = await saveUserSchedule(message, userUpdate);

	// We received Napchart, cache it:
	if (is_nurl) {
		if (nurl.host == "napchart.com") {
			//Dry run, we are caching
			getOrGenImg(nurl, message, true);
		}
	}


	// We received Schedule change, process it:
	if (is_schedule) {
		if (message.author.nickname == null) {
		new_username = message.author.username + ` [${args[0].toUpperCase()}]`
		} else {
			//TODO: we have to remvoe schedule tag (if any) and then append new one
		}
		console.log("ACT   : ", "Change usrname for " +message.author.username + " to "+new_username)
		if(!dry){message.member.setNickname(new_username);}
		msg = "Schedule set for " + message.author.tag + " to `" + args[0] + "`.";
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}

		let newRole = schedules[schedn].category;
		let role = message.guild.roles.find("name", newRole);
		console.log("ACT   : ", "Change role for " +message.author.username + " to "+newRole)
		if(!dry){role && message.member.addRole(role.id);}
	}

	// We received Napchart, process it:
	if (is_nurl) {
		msg = "Nap Chart set for " + message.author.tag + " to " + nurl.href + "."
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
		if (nurl.host == "napchart.com") {
			// Include http(s) when specifying URLs
			getOrGenImg(nurl, message, dry);
		}
	}



	function buildUserInstance() {
		let userUpdate = {
			tag: message.author.tag,
			userName: message.author.username,
			updatedAt: new Date(message.createdTimestamp)
		};
		if (is_schedule) {
			userUpdate.currentScheduleName = schedfull;
		}
		if (is_nurl) {
			userUpdate.currentScheduleChart = urlPossible;
		}
		return userUpdate;
	}

	function checkIsUrlAndGet(urlPossible) {
		try {
			let nurl = new URL(urlPossible);
			if (nurl.host == "napchart.com") {
				return { is_nurl: true, nurl: nurl };
			}
		} catch (err) {
			// console.log("set image error: " + err);
			return { is_nurl: false };
		}
	}

	function checkIsSchedule(schedulePossible) {
		if (schedulePossible) {
			const schedp_arr = schedulePossible.trim().split(/-+/g);
			const schedn = schedp_arr[0].toLowerCase();
			if (
				schedp_arr.length <= 2 &&
				Object.keys(schedules).includes(schedn) &&
				(schedp_arr.length == 1 ||
					(schedp_arr.length == 2 && modifiers.includes(schedp_arr[1])))
			) {
				if (schedp_arr.length == 1) {
					return { is_schedule: true, schedn, schedfull: schedn };
				} else {
					return { is_schedule: true, schedn, schedfull: schedn + schedp_arr[1] };
				}
			} else {
				return { is_schedule: false };
			}
		}
	}

	async function saveUserSchedule(message, userUpdate) {
		let query = { id: message.author.id },
			options = { upsert: true, new: true, setDefaultsOnInsert: true };

		let result = null;
		try {
			result = await UserModel.findOneAndUpdate(query, userUpdate, options);
			saveHistories();
		} catch (error) {
			console.log("error seraching for User: ", error);
			if(!dry){message.channel.send("Something done broke.  Call the fire brigade");}
			return;
		}
		return result;

		function saveHistories() {
			if (!result) {
				return;
			}
			if ('currentScheduleName' in userUpdate) {
				result.historicSchedules.push({
					name: userUpdate.currentScheduleName,
					setAt: new Date(message.createdTimestamp),
					adapted: false
				});
			}
			if ('currentScheduleChart' in userUpdate && userUpdate.currentScheduleChart != null) {
				result.historicScheduleCharts.push({
					url: userUpdate.currentScheduleChart
				});
			}
			result.save();
		}
	}
}

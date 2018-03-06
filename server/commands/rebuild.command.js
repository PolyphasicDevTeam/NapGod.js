const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const set = require("./set.backend").setInternalPromise;
const { processCommands } = require("../command.ctrl");

module.exports = {
	processMset: function(command, message, args, dry=false) {
		if (command === "mrebuild") {
			if(dry) {
				console.log("WARN>>: ", "+mrebuild cannot be executed dry to avoid cyclic behaviour")
				return true
			}
			let roles =  message.member.roles
			roles = new Set(roles.keys())
			let mods = message.guild.roles.find("name", "Moderators").id
			let admins = message.guild.roles.find("name", "Admins").id
			permissions = false
			if (roles.has(mods)||roles.has(admins)) {
				permissions = true
			}
			if (!permissions) {
				msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+mrebuild`"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			else if (args.length == 1) {
				rebuild(args, message, dry);
			} else {
				msg = "Valid options are `+mrebuild [report-interval]`. [report-interval] must be positive integer or 0 for no progress reporting"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			return true
		}
		return false
	}
};

async function rebuild(args, message, dry) {
	console.log("CMD   : MREBUILD")
	console.log("ARGS  : ", args)
	repfreq = parseInt(args[0])
	if(isNaN(repfreq) || repfreq < 0) {
		msg = "Valid options are `+mrebuild [report-interval]`. [report-interval] must be positive integer or 0 for no progress reporting"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	}

	msg = `Starting rebuild. This will take some time. I hope you wiped your database before running this. You also want the bot to be in mod-only mode so user commands do not get registered before the rebuild is complete. Progress will be reported every ${repfreq} iterrations.`
	console.log("MSG   : ", msg)
	if(repfreq>0) {message.channel.send(msg);}

	msg = "Recreate 1/4: Reading messages from all channels"
	console.log("MSG   : ", msg)
	if(repfreq>0) {message.channel.send(msg);}

	channels = Array.from(message.guild.channels.values())
	//console.log("INFO  : ","channels:", channels)
	commands = []
	for(ch of channels) {
		console.log("INFO  : ","Processing channel:", ch.name)
		if (ch.type != "text") { continue }

		msgs = await ch.fetchMessages({limit: 100})
		while (msgs.length != 0) {
			nextId = null
			nextTime = null
			msgs.forEach(function(msg) {
				console.log("INFO  : ","message:", msg.createdAt)
				//console.log("INFO  : ","message:", msg.content)
				//Immitate app.js
				if (msg.author.bot) {
				} else {

					const args = getArgs(msg);
					const command = args.shift().toLowerCase();
					if (command == '') { } //There is probably space after prefix, reject
					else {

						if (isValidPrefix(msg)) {
							commands.push(msg)
							if(repfreq > 0 && commands.length % repfreq == 0) {
								msg = `Recreate 1/4: ${commands.length} commands were found...`
								console.log("MSG   : ", msg)
								message.channel.send(msg);
							}
						}
					}

				}
				if (nextTime == null || nextTime > msg.createdAt.getTime()){
					nextTime = msg.createdAt.getTime()
					nextId = msg.id
				}
			})

			msgs = await ch.fetchMessages({limit: 100, before: nextId})
		}
	}

	msg = `Recreate 2/4: Total of ${commands.length} command was found. Ordering by datetime.`
	console.log("MSG   : ", msg)
	if(repfreq>0) {message.channel.send(msg);}

	commands.sort(function(a, b) {
		var dateA = a.createdAt.getTime()
		var dateB = b.createdAt.getTime()
		return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
	});

	msg = "Recreate 3/4: Done sorting commands. Executing commands in dry mode, discord will be unaffected."
	console.log("MSG   : ", msg)
	if(repfreq>0) {message.channel.send(msg);}
	n_done = 0
	commands.forEach(function(message) {
		const args = getArgs(msg);
		const command = args.shift().toLowerCase();
		processCommands(command, message, args, true);
		n_done += 1
		if(repfreq > 0 && n_done % repfreq == 0) {
			msg = `Recreate 3/4: ${commands.length} commands were executed...`
			console.log("MSG   : ", msg)
			message.channel.send(msg);
		}
	})

	msg = "Recreate 4/4: Finished successfully."

}

function isValidPrefix(message) {
	return message.content.indexOf(config.prefix) === 0;
}

function getArgs(message) {
	return message.content
		.slice(config.prefix.length)
		.trimRight()
		.split(/ +/g);
}



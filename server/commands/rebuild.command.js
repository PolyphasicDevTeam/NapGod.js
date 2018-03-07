const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const set = require("./set.backend")
const mset = require("./mset.backend")

module.exports = {
	processMrebuild: function(command, message, args, dry=false) {
		if (command === "mrebuild") {
			if(dry) {
				console.log("WARN>>: ", "+mrebuild cannot be executed dry to avoid cyclic behaviour")
				return true
			}
			let roles =  message.member.roles
			roles = new Set(roles.keys())
			let admins = message.guild.roles.find("name", "Admins").id
			permissions = false
			if (roles.has(admins)) {
				permissions = true
			}
			if (!permissions) {
				msg = "You do not have privileges to execute this commands. Only Admins are allowed to use `+mrebuild`"
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

	msg = `Starting rebuild. This will take some time. I hope you wiped your database before running this. You also want the bot to be in mod-only mode so user commands do not get registered before the rebuild is complete. Progress will be reported every ${repfreq} iterations.`
	console.log("MSG   : ", msg)
	if(repfreq>0) {message.channel.send(msg);}

	msg = "Rebuild 1/4: Reading messages from all channels"
	console.log("MSG   : ", msg)
	if(repfreq>0) {message.channel.send(msg);}

	channels = Array.from(message.guild.channels.values())
	//console.log("INFO  : ","channels:", channels)
	commands = []
	for(ch of channels) {
		console.log("INFO  : ","Processing channel:", ch.name)
		if (ch.type != "text") { continue }

		msgs = await ch.fetchMessages({limit: 100})
		nextTime = null
		while (msgs.length != 0) {
			nextId = null
			msgs.forEach(function(dmsg) {
				if (nextTime == null || nextTime > dmsg.createdAt.getTime()){
					//console.log("INFO  : ","message:", dmsg.createdAt)
					//console.log("INFO  : ","message:", msg.content)
					//Immitate app.js
					if (dmsg.author.bot) {
					} else {

						const dargs = getArgs(dmsg);
						const dcommand = dargs.shift().toLowerCase();
						console.log("INFO  : ", dcommand)
						if (dcommand == '') { } //There is probably space after prefix, reject
						else if (dcommand != 'set' || dcommand != 'mset' ) { } //There is probably space after prefix, reject
						else {
							console.log("INFO  : ", dmsg.content)
							if (isValidPrefix(dmsg)) {
								console.log("INFO  : ", "valid")
								commands.push(dmsg)
								if(repfreq > 0 && commands.length % repfreq == 0) {
									msg = `Rebuild 1/4: ${commands.length} m/set commands were found...`
									console.log("MSG   : ", msg)
									message.channel.send(msg);
								}
							}
						}

					}
					nextTime = dmsg.createdAt.getTime()
					nextId = dmsg.id
				}
			})
			if (nextId == null) {break;}
			msgs = await ch.fetchMessages({limit: 100, before: nextId})
		}
	}

	msg = `Rebuild 2/4: Total of ${commands.length} m/set command was found. Ordering by datetime.`
	console.log("MSG   : ", msg)
	if(repfreq>0) {await message.channel.send(msg);}

	commands.sort(function(a, b) {
		var dateA = a.createdAt.getTime()
		var dateB = b.createdAt.getTime()
		return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0;
	});

	msg = "Rebuild 3/4: Done sorting commands. Executing set/mset commands in dry mode, discord will be unaffected."
	console.log("MSG   : ", msg)
	if(repfreq>0) {await message.channel.send(msg);}
	n_done = 0
	n_processed = 0
	for (dmessage of commands) {
		const dargs = getArgs(dmessage);
		const dcommand = dargs.shift().toLowerCase();
		was_processed = await set.processSetBlock(dcommand, dmessage, dargs, true)
		was_processed = was_processed || await mset.processMsetBlock(dcommand, dmessage, dargs, true)
		if(was_processed) { n_processed += 1 }
		n_done += 1
		if(repfreq > 0 && n_done % repfreq == 0) {
			msg = `Rebuild 3/4: ${n_done} (${n_processed} OK) commands were executed...`
			console.log("MSG   : ", msg)
			await message.channel.send(msg);
		}
	}

	msg = "Rebuild 4/4: Finished successfully."
	console.log("MSG   : ", msg)
	await message.channel.send(msg);

}

function isValidPrefix(message) {
	return message.content.indexOf(config.prefix) === 0;
}

function getArgs(message) {
	return message.content
		.slice(config.prefix.length)
		.trimRight()
		.replace( /\n/g, " " )	
		.split(/ +/g);
}



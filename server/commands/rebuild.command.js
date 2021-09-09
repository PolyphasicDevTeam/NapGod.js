const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapchartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const set = require("./set.backend")
const mset = require("./mset.backend")
const setInternal = require("./set.backend").setInternalPromise;

const schedules = require("./schedules").schedules
const modifiers = require("./schedules").modifiers
const roles = require("./schedules").roles

module.exports = {
	processMrebuild: function(command, message, args, dry=false) {
		if (command === "mrebuild") {
			if(dry) {
				console.log("WARN>>: ", "+mrebuild cannot be executed dry to avoid cyclic behaviour")
				return true
			}
			mroles =  message.member.roles
			mroles = new Set(mroles.keys())
			let admins = message.guild.roles.find("name", "Admins").id
			permissions = false
			if (mroles.has(admins)) {
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

	msg = "Rebuild 1/5: Reading messages from all channels"
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
						//console.log("INFO  : ", dcommand, dcommand != 'set', dcommand != 'mset', dcommand == '')
						if (dcommand == '') { } //There is probably space after prefix, reject
						else if (dcommand != 'set' && dcommand != 'mset' ) { } //Neither set nor mset
						else {
							//console.log("INFO  : ", dmsg.content)
							if (isValidPrefix(dmsg)) {
								//console.log("INFO  : ", "valid")
								commands.push(dmsg)
								if(repfreq > 0 && commands.length % repfreq == 0) {
									msg = `Rebuild 1/5: ${commands.length} m/set commands were found...`
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

	msg = `Rebuild 2/5: Total of ${commands.length} m/set command was found. Ordering by datetime.`
	console.log("MSG   : ", msg)
	if(repfreq>0) {await message.channel.send(msg);}

	commands.sort(function(a, b) {
		var dateA = a.createdAt.getTime()
		var dateB = b.createdAt.getTime()
		return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0;
	});

	msg = "Rebuild 3/5: Done sorting commands. Executing set/mset commands in dry mode, discord will be unaffected."
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
		else {
			console.log("WARN>>: ", dcommand, dargs, " was not processed.")
		}
		n_done += 1
		if(repfreq > 0 && n_done % repfreq == 0) {
			msg = `Rebuild 3/5: ${n_done} (${n_processed} OK) commands were executed...`
			console.log("MSG   : ", msg)
			await message.channel.send(msg);
		}
	}
	msg = "Rebuild 4/5: Finished command reconstruction. Validating schedule tags."
	console.log("MSG   : ", msg)
	if(repfreq>0) {await message.channel.send(msg)}

	res = await message.guild.fetchMembers()
	ms = res.members
	ms = ms.array()
	msg = `Rebuild 4/5: Done fetching members. Processing tags for ${ms.length} members.`
	console.log("MSG   : ", msg)
	if(repfreq>0) {await message.channel.send(msg)}

	msg = ""
	for (mbr of ms) {
		//Deterime schedule in discord
		dcrd_sch = null
		dcrd_nick = mbr.nickname
		if (mbr.nickname == null) {
			dcrd_nick = mbr.user.username
		} 
		if (dcrd_nick != null) {
			ptag_start = dcrd_nick.lastIndexOf(' [')
			ptag_end = dcrd_nick.lastIndexOf(']')
			if (ptag_start != -1 && ptag_end > ptag_start) {
				dcrd_sch = dcrd_nick.slice(ptag_start+2,ptag_end)
			}
		}

		console.log("INFO  : ", dcrd_sch)
		dbmbr = await UserModel.findOne({id: mbr.user.id});
		if (!dcrd_sch) {
			if (dbmbr && dbmbr.currentScheduleName) { //We found user in our database but tag is missing
				msga = `${mbr.user.tag} - Schedule in db is [${dbmbr.currentScheduleName}] but tag is missing, resolve manually\n`
				console.log("MSG   : ", msga)
				msg+=msga
				if(repfreq>0 && msg.length > 1500) {await message.channel.send(msg);msg = ""}
			}

			mroles =  mbr.roles
			mroles = new Set(mroles.keys())
			for (sch of Object.values(roles)) {
				if (mroles.has(message.guild.roles.find("name",sch.name).id)) {
					msga = `${mbr.user.tag} - has ${sch.name} role but no schedule tag, resolve manually\n`
					console.log("MSG   : ", msga)
					msg+=msga
					if(repfreq>0 && msg.length > 1500) {await message.channel.send(msg);msg = ""}
				}
			}
			continue
		}

		var { is_schedule, schedn, schedfull } = checkIsSchedule(dcrd_sch);
		if (!is_schedule) {
			msga = `${mbr.nickname} - [${dcrd_sch}] is invalid schedule tag, resolve manually\n`
			console.log("MSG   : ", msga)
			msg+=msga
			if(repfreq>0 && msg.length > 1500) {await message.channel.send(msg);msg = ""}
			continue

		}

		mroles =  mbr.roles
		mroles = new Set(mroles.keys())
		for (sch of Object.values(roles)){
			if ( schedules[schedn].category == sch.name) {
				if (!mroles.has(message.guild.roles.find("name",sch.name).id)) {
					msga = `${mbr.nickname} - has no ${sch.name} role but [${dcrd_sch}] schedule tag, resolve manually\n`
					console.log("MSG   : ", msga)
					msg+=msga
					if(repfreq>0 && msg.length > 1500) {await message.channel.send(msg);msg = ""}
				}
			} else {
				if (mroles.has(message.guild.roles.find("name",sch.name).id)) {
					msga = `${mbr.nickname} - has ${sch.name} role but [${dcrd_sch}] schedule tag, resolve manually\n`
					console.log("MSG   : ", msga)
					msg+=msga
					if(repfreq>0 && msg.length > 1500) {await message.channel.send(msg);msg = ""}
				}
			}
		}

		//Get info from our database
		if (dbmbr && 
			(!dbmbr.currentScheduleName ||
			(dbmbr.currentScheduleName 
			&& dbmbr.currentScheduleName.toLowerCase() != dcrd_sch.toLowerCase()))) {
			msga = `${mbr.nickname} - Schedule in db is [${dbmbr.currentScheduleName}] but tag shows [${dcrd_sch}], resolve manually\n`
			console.log("MSG   : ", msga)
			msg+=msga
			if(repfreq>0 && msg.length > 1500) {await message.channel.send(msg);msg = ""}
			continue

		} 

		if (dcrd_sch && !dbmbr ) { //We have discord username but no database entry
			//Autoresolve using mset
			await setInternal([dcrd_sch, "none"], message, true,mbr.user,mbr,true)
			msga = `${mbr.nickname} - Schedule not found in database, autoresolved\n`
			console.log("MSG   : ", msga)
			//msg+=msga
			//if(repfreq>0 && msg.length > 1500) {await message.channel.send(msg);msg = ""}
		}

	}
	if(repfreq>0) {await message.channel.send(msg);msg = ""}


	msg = "Rebuild 5/5: Finished successfully."
	console.log("MSG   : ", msg)
	if(repfreq>0) {await message.channel.send(msg)}

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

function checkIsSchedule(schedulePossible) {
	if (schedulePossible) {
		const schedp_arr = schedulePossible.trim().split(/-+/g);
		const schedn = schedp_arr[0].toLowerCase();

		if (Object.keys(schedules).includes(schedn)) {
			if (schedp_arr.length == 2) {
				const schedmod = schedp_arr[1].toLowerCase();
				if (Object.keys(modifiers).includes(schedmod)) {
					return { is_schedule: true, schedn, schedfull: schedules[schedn].name + "-" + modifiers[schedmod].name };
				}
			} else if (schedp_arr.length == 1) {
				return { is_schedule: true, schedn, schedfull: schedules[schedn].name };
			}
		}
		return { is_schedule: false };
	}
	return { is_schedule: false };
}



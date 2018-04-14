const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const set = require("./set.backend").setInternalPromise;

whitelist = [
	"282078315588747264",//Ssk
	"362687114954932224", //Jte
	"351906266819330048", //Aeth
	"147356941860077568", //TTR
	"380207783171194882", //Crm
	"220170052735991808", //Shy
	"249218756298014720", //Ngn
	"136870685711532032" //LTL
]


module.exports = {
	msetInternal: function(args, message, dry) {
		mset(args, message, dry);
	},
	processMsetBlock: (async function(command, message, args, dry=false) {
		if (command === "mset") {
			//console.log("INFO  : ", "MSET execution attempted by ", message.author.tag, message.author.id)
			permissions = false
			if (whitelist.indexOf(message.author.id) > -1) {
				console.log("INFO  : ", "MSET was whitelisted for", message.author.tag, message.author.id)
				permissions = true
			} else {
				if (message.author == null || message.member == null) {
					console.log("WARN>>: ", "Member or author no longer exists")
					return true;
				}
				let roles =  message.member.roles
				roles = new Set(roles.keys())
				let mods = message.guild.roles.find("name", "Moderators").id
				let admins = message.guild.roles.find("name", "Admins").id
				if (roles.has(mods)||roles.has(admins)) {
					permissions = true
				}
			}
			if (!permissions) {
				msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+mset`"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			else if (args.length >= 3) {
				await mset(args, message, dry);
			} else {
				msg = "Valid options are `+mset [schedule-name] [napchart-link] [username]`"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			return true
		}
		return false
	})

};

async function mset(args, message, dry) {
	let msg = "";
	//We need to extract the username which can containe arbitrary whitespaces
	//First get rid of the prefix and 'mset' command string (4chars long) and trim
	arg = message.content.slice(config.prefix.length+4,message.content.length).trim()
	//Next there is the schedule name. Its a single word so find next whitespace and
	//cut everything before it, trim the space once thats done
	arg = arg.substr(arg.indexOf(' ')+1).trim()
	//Next do the same for url and trim, we should now be left with just the username string
	arg = arg.substr(arg.indexOf(' ')+1).trim()

	console.log("CMD   : MSET")
	console.log("ARGS  : ", args[0], args[1], arg)

	//Lets see if we can get user id from mention string
	var uid = arg.replace(/[<@!>]/g, '');
	if (uid != '') {//Try to get user by id
		console.log("INFO  : ", "User mentioned by UID", uid)
		let user = null;
		try {
			member = await message.guild.fetchMember(uid);
		} catch (err) {
			console.warn("WARN  : ", "User could not be fetched by UID", uid);
		}
		if (member != null) { //We found a valid user
			console.log("INFO  : ", "User was found by UID", member.user.tag)
			set([args[0], args[1]], message, dry,member.user,member,true).then(res=>{
				if (!res) {
					msg = "Valid options are `+mset [schedule-name] [napchart-link] [username]`"
					console.log("MSG   : ", msg)
					if(!dry){message.channel.send(msg);}
				} else {
					msg = "Schedule set for " + member.user.tag + " to `" + args[0] + "`.\n";
					msg += "Nap Chart set for " + member.user.tag + " to " + args[1] + "."
					if(!dry){message.channel.send(msg);}
				}
			})
			return
		}
	}


	//res = await message.guild.fetchMembers(arg)
	res = await message.guild.fetchMembers()
	ms = res.members
	ms = ms.array()

	nicks = []
	unames = []
	tags = []
	for(var i=0; i < ms.length; i++) {
		m = ms[i]
		nickname = m.nickname
		if(nickname!=null){
			ptag_start = nickname.lastIndexOf(' [')
			if (ptag_start != -1) {
				nickname = nickname.slice(0,ptag_start)
			}
		}
		if(nickname == arg) { nicks.push(m)	}
		if(m.user.username == arg) { unames.push(m) }
		if(m.user.tag == arg) { tags.push(m) }
	}

	usr = null
	if(nicks.length > 0) { //We have some nicks that match
		if(nicks.length == 1) {
			usr = nicks[0]
		} else {
			msg = `Multiple users with nickname **${arg}** have been found: `
			nicks.forEach(nick => {msg = msg + nick.user.tag + " "})
			console.log("MSG   : ", msg)
			if(!dry){message.channel.send(msg);}
		}
	} else if(unames.length > 0) { //We have some user names that match
		if(unames.length == 1) {
			usr = unames[0]
		} else {
			msg = `Multiple users with username **${arg}** have been found: `
			unames.forEach(uname => {msg = msg + uname.user.tag + " "})
			console.log("MSG   : ", msg)
			if(!dry){message.channel.send(msg);}
		}
	} else if(tags.length > 0) { //We have some user tags that match
		usr = tags[0]
	} else {
		msg = `User with nickname, username or tag '**${arg}**' was not found in the discord.`
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	}
	if (usr!=null) {
		res = await set([args[0], args[1]], message, dry,usr.user,usr,true)
		if (!res) {
			msg = "Valid options are `+mset [schedule-name] [napchart-link] [username]`"
			console.log("MSG   : ", msg)
			console.log("WARN>>: ", "MSET failed with args: ", args[0], args[1], arg)
			if(!dry){message.channel.send(msg);}
		} else {
			msg = "Schedule set for " + usr.user.tag + " to `" + args[0] + "`.\n";
			msg += "Nap Chart set for " + usr.user.tag + " to " + args[1] + "."
			if(!dry){message.channel.send(msg);}
		}
	}
}

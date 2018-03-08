const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");

module.exports = {
	processGet: function(command, message, args, dry=false) {
		if (command === "get") {
			//if (args.length <= 1) {
			get(args, message, dry);
			//} else {
			//What?
			//msg = "Valid options are `+get` or `+get userName` or `+get usertag#1234`"
			//console.log("MSG   : ", msg)
			//if(!dry){message.channel.send(msg);}
			//}
			return true
		}
		return false
	}
};

async function get(args, message, dry) {
	let msg = "";
	arg = message.content.slice(config.prefix.length+3,message.content.length).trim()
	console.log("CMD   : GET")
	console.log("ARGS  : ", arg)
	var uid = arg.replace(/[<@!>]/g, '');
	if (args.length === 1) {
		if (uid != '') {//Try to get user by id
			user = message.guild.member(uid);
			if (user != null) { //We found a valid user
				let res;
				try {
					res = await UserModel.findOne({id: user.user.id});
				} catch (err) {
					console.warn("WARN  : ", "Could not get user: ", err);
				}

				if (res && res.currentScheduleChart) {
					let d = new Date(res.updatedAt);
					var n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');

					msg = `Napchart for **${user.user.tag}** (since ${n}):`
					console.log("MSG   : ", msg)
					if(!dry){
						rem = await getOrGenImg(res.currentScheduleChart, message, dry);
						message.channel.send(msg, {embed: rem});
					}
				} else {
					msg = `There is no napchart available for **${user.user.username}**`
					console.log("MSG   : ", msg)
					if(!dry){message.channel.send(msg);}
				}
				return
			}
		}


		res = await message.guild.fetchMembers(args[0])
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
		uid = null
		if(nicks.length > 0) { //We have some nicks that match
			if(nicks.length == 1) {
				uid = nicks[0].user.id	
				usr = nicks[0].user.tag
			} else {
				msg = `Multiple users with nickname **${arg}** have been found: `
				nicks.forEach(nick => {msg = msg + nick.user.tag + " "})
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
		} else if(unames.length > 0) { //We have some user names that match
			if(unames.length == 1) {
				uid = unames[0].user.id	
				usr = unames[0].user.tag
			} else {
				msg = `Multiple users with username **${arg}** have been found: `
				unames.forEach(uname => {msg = msg + uname.user.tag + " "})
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
		} else if(tags.length > 0) { //We have some user tags that match
			uid = tags[0].user.id	
			usr = tags[0].user.tag
		} else {
			msg = `User with nickname, username or tag '**${arg}**' was not found in the discord.`
			console.log("MSG   : ", msg)
			if(!dry){message.channel.send(msg);}
		}
		if (uid!=null) {
			try {
			res = await UserModel.findOne({id: uid})
			} catch(err) {
				console.warn("WARN  : ", "Could not get user: ", err)
				msg = `There is no napchart available for **${arg}**`
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
				return;
			}
			if (res && res.currentScheduleChart) {
				let d = new Date(res.updatedAt);
				var n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');

				msg = `Napchart for **${usr}** (since ${n}):`
				console.log("MSG   : ", msg)
				if(!dry){
					rem = await getOrGenImg(res.currentScheduleChart, message, dry);
					message.channel.send(msg, {embed: rem});
				}
			} else {
				msg = `There is no napchart available for **${arg}**`
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}

		}
	} else if (args.length === 0) {
		let res;
		try {
			res = await UserModel.findOne({id: message.author.id});
		} catch (err) {
			console.warn("WARN  : ", "Could not get user: ", err);
		}

		if (res && res.currentScheduleChart) {
			let d = new Date(res.updatedAt);
			var n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');

			msg = `Napchart for **${message.author.tag}** (since ${n}):`
			console.log("MSG   : ", msg)
			if(!dry){
				rem = await getOrGenImg(res.currentScheduleChart, message, dry);
				message.channel.send(msg, {embed: rem});
			}
		} else {
			msg = `There is no napchart available for **${message.author.tag}**`
			console.log("MSG   : ", msg)
			if(!dry){message.channel.send(msg);}
		}

	}
}

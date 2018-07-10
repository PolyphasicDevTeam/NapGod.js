const _ = require("lodash");
const UserModel = require("./../models/user.model");
const config = require("../../config.json");

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
    bob: function(args, message, dry) {
	adapt(args, message, dry);
    },
    processAdaptedBlock: (async function(command, message, args, dry=false) {
	if (command === "adapted") {
	    permissions = false
	    if (whitelist.indexOf(message.author.id) > -1) {
		console.log("INFO  : ", "ADAPT was whitelisted for", message.author.tag, message.author.id)
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
		msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+adapted`"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    else if (args.length >= 3) {
		await adapted(args, message, dry);
	    } else {
		msg = "Valid options are `+adapted [username]`"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    return true
	}
	return false
    })

};








async function adapt(args, message, dry) {
    let msg = "";
    user = args[0];

    console.log("CMD   : ADAPTED")
    console.log("ARGS  : ", user)

    //Lets see if we can get user id from mention string
    let uid = user.replace(/[<@!>]/g, '');
    if (uid != '') {//Try to get user by id
	console.log("INFO  : ", "User mentioned by UID", uid)
	let member = null;
	try {
	    member = await message.guild.fetchMember(uid);
	} catch (err) {
	    console.warn("WARN  : ", "User could not be fetched by UID", uid);
	}
	if (member != null) { //We found a valid user
	    console.log("INFO  : ", "User was found by UID", member.user.tag)
	    let roles = member.roles;
	    roles = new Set(roles.keys());
	    let role = message.guild.roles.find("name", "Currently Adapted");
	    if (roles.has(role.id)){
		roles.delete(role.id);
		msg = member.user.tag + " is no longer adapted";
	    } else {
		roles.add(role.id);
		msg = member.user.tag + " is now adapted";
	    }
	    if(!dry){member.setRoles(Array.from(roles));}
	    if(!dry){message.channel.send(msg);}
	    return
	}
    }


    //res = await message.guild.fetchMembers(user)
    res = await message.guild.fetchMembers()
    ms = res.members
    ms = ms.array()

    nicks = []
    unames = []
    tags = []
    for(let i=0; i < ms.length; i++) {
	m = ms[i]
	nickname = m.nickname
	if(nickname!=null){
	    ptag_start = nickname.lastIndexOf(' [')
	    if (ptag_start != -1) {
		nickname = nickname.slice(0,ptag_start)
	    }
	}
	if(nickname == user) { nicks.push(m)	}
	if(m.user.username == user) { unames.push(m) }
	if(m.user.tag == user) { tags.push(m) }
    }

    usr = null
    if(nicks.length > 0) { //We have some nicks that match
	if(nicks.length == 1) {
	    usr = nicks[0]
	} else {
	    msg = `Multiple users with nickname **${user}** have been found: `
	    nicks.forEach(nick => {msg = msg + nick.user.tag + " "})
	    console.log("MSG   : ", msg)
	    if(!dry){message.channel.send(msg);}
	}
    } else if(unames.length > 0) { //We have some user names that match
	if(unames.length == 1) {
	    usr = unames[0]
	} else {
	    msg = `Multiple users with username **${user}** have been found: `
	    unames.forEach(uname => {msg = msg + uname.user.tag + " "})
	    console.log("MSG   : ", msg)
	    if(!dry){message.channel.send(msg);}
	}
    } else if(tags.length > 0) { //We have some user tags that match
	usr = tags[0]
    } else {
	msg = `User with nickname, username or tag '**${user}**' was not found in the discord.`
	console.log("MSG   : ", msg)
	if(!dry){message.channel.send(msg);}
    }
    if (usr!=null) {
	let roles = usr.roles
	roles = new Set(roles.keys())
	let role = message.guild.roles.find("name", "Currently Adapted");
	if (roles.has(role.id)){
	    roles.delete(role.id);
	    msg = usr.user.tag + " is no longer adapted";
	} else {
	    roles.add(role.id);
	    msg = usr.user.tag + " is now adapted1";
	}
	if(!dry){usr.setRoles(Array.from(roles));}
	if(!dry){message.channel.send(msg);}
    }
}


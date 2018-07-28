const _ = require("lodash");
const UserModel = require("./../models/user.model");
const config = require("../../config.json");
const schedules = require("./schedules").schedules
const modifiers = require("./schedules").modifiers


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
    adapt_to: function(args, message, dry) {
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
		mods = message.guild.roles.find("name", "Moderators").id
		admins = message.guild.roles.find("name", "Admins").id
		if (roles.has(mods)||roles.has(admins)) {
		    permissions = true
		}
	    }
	    if (!permissions) {
		msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+adapted`"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
	    }
	    else if (args.length >= 1) {
		await adapt(args, message, dry);
	    } else {
		msg = "Valid options are `+adapted [schedule] [username]`"
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
    //We need to extract the username which can containe arbitrary whitespaces
    //First get rid of the prefix and 'adapted' command string (8chars long) and trim
    user = message.content.slice(config.prefix.length+8,message.content.length).trim()
    sch = args[0];
    let { is_schedule, schedn, schedfull } = checkIsSchedule(sch);
    if (is_schedule){
	console.log("INFO  : ", "Schedule1 is ", schedules[schedn].name);
	//Next there is the schedule name. Its a single word so find next whitespace and
	//cut everything before it, trim the space once thats done
	user = user.substr(user.indexOf(' ')+1).trim()
    } 
    
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
	    await adapt_one(member, schedfull, is_schedule, message, dry);
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
	await adapt_one(usr, schedfull, is_schedule, message, dry);

    }
}


async function adapt_one(user, schedule, is_schedule, message, dry){
    let msg="";
    upd = await UserModel.findOne({id: usr.id});
    console.log("INFO  : ", "Schedule is ", schedule, " | true? : ",is_schedule);
    roles = user.roles
    roles = new Set(roles.keys())
    role = message.guild.roles.find("name", "Currently Adapted");
    if (! is_schedule) {
	schedule = upd.currentScheduleName;
	let { is_schedule, schedn, schedfull } = checkIsSchedule(schedule);
	console.log("SCHEDULE :", schedule, " schedfull: ",schedfull, " | is_schedule: ", is_schedule, " | schedn:", schedn);
	if (upd != null) {
	    if (roles.has(role.id)){
		msg = user.user.tag + " is already adapted to "+schedule+"\n";
		if(!dry){message.channel.send(msg);}
		return
	    } else {
		role_sch = message.guild.roles.find("name", "Adapted-"+schedules[schedn].name);
		old_role_sch = message.guild.roles.find("name", "Attempted-"+schedules[schedn].name);
		if (role_sch == null){ // I suppose for each adapted there is an attempted (but there is attempted-random and iirc no adapted-random)
		    msg = "There is no Adapted-"+schedules[schedn].name+" role\n";
		} else {
		    roles.delete(old_role_sch.id);
		    roles.add(role_sch.id);
		}
		roles.add(role.id);
		msg += user.user.tag + " is currently adapted to "+schedule+"\n"; // schedule is the name in the DB as e3-flex-shortened-compressed-light-and-dark
		adapted = true;
		let userUpdate = buildUserInstance(user.user, message, schedule);
		let result = await saveUserSchedule(message, userUpdate, user.user, dry, adapted);
	    }
	} else {
	    msg = "One can't be adapted without a schedule. Use +set (or +mset if mod) to set a schedule)";
	    if(!dry){message.channel.send(msg);}
	    return
	    
	}
    } else {
	role_sch = message.guild.roles.find("name", "Adapted-"+schedule);
	old_role_sch = message.guild.roles.find("name", "Attempted-"+schedule);
	if (role_sch == null){
	    msg = "There is no Adapted-"+schedule+" role";
	    if(!dry){message.channel.send(msg);}
	    return
	} else {
	    roles.delete(old_role_sch.id);
	    roles.add(role_sch.id);
	    msg = user.user.tag + " has now the adapted-"+schedule+" role\n";
	    adapted = true;
	}
    }
    if(!dry){user.setRoles(Array.from(roles));}
    if(!dry){message.channel.send(msg);}
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
}

function buildUserInstance(author, message, sch) {
    let userUpdate = {
	tag: author.tag,
	userName: author.username,
	updatedAt: new Date(message.createdTimestamp)
    };
    
    userUpdate.currentScheduleName = sch;
    return userUpdate;
}
async function saveUserSchedule(message, userUpdate, author, dry, adapted) {
    let query = { id: author.id },
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
	result.historicSchedules.push({
	    name: userUpdate.currentScheduleName,
	    setAt: new Date(message.createdTimestamp),
	    adapted: adapted
	});
	result.save();
    }
}

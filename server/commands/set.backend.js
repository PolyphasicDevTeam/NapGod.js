const url = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const ReportModel = require("./../models/report.model");
const { getOrGenImg, makeNapchartImageUrl } = require("./../imageCache");
const schedules = require("./schedules").schedules;
const modifiers = require("./schedules").modifiers;
const { getNapchart } = require('./napchart.js');

//const ncRegex_OldScheme = /^(([a-z]|\d){5,6})$/
//const ncRegex_Snapshot = /^snapshot\/((\w|\d){9})$/
//const ncRegex_UserChart = /^\w{6,100}\/.*\-\w{6,9}$/
const napchartPathRegex = /^(([a-z]|\d){5,6})$|^snapshot\/((\w|\d){9})$|^\w{6,100}\/.*\-\w{6,9}$/


module.exports = {
  setInternal: function(args, message, dry, author=null, member=null) {
    if (author == null) { author = message.author; }
    if (member == null) { member = message.member; }
    if (author == null || member == null) {
      console.log("WARN>>: ", "Member or author no longer exists");
      return;
    }
    set(args, message, dry, author, member, false);
  },
  setInternalPromise: function(args, message, dry, author=null, member=null, silent = true) {
    return new Promise(function (resolve, reject) {
      if (author == null) { author = message.author; }
      if (member == null) { member = message.member; }
      if (author == null || member == null) {
	console.log("WARN>>: ", "Member or author no longer exists");
	resolve(false);
      }
      resolve(set(args, message, dry, author, member, silent));
    });
  },
  processSetBlock: (async function(command, message, args, dry=false) {
    if (command === "set") {
      if (args.length <= 2 && args.length > 0) {
	author = message.author;
	member = message.member;
	if (author == null || member == null) {
	  console.log("WARN>>: ", "Member or author no longer exists");
	  return false;
	}
	await set(args, message, dry, author, member, false);
      } else {
      msg = "Bad input format: Use `+set [schedule-name]` or `+set [napchart-link]`. Use `+set none` to remove your chart without changing schedule.";
console.log("MSG   : ", msg);
	if(!dry){message.channel.send(msg);}
      }
      return true;
    } else {
      return false;
    }
  })

};


//Returns true if both schedule and napchart are set
//silent supresses dicord text output only, changes still take place
//(provided dry=false)
async function set(args, message, dry, author, member, silent) {
    complete = true;
    let msg = "";
    let urlPossible = args.length === 2 ? args[1] : args[0];
    if (urlPossible.slice(-1) === "/") urlPossible = urlPossible.toString().substring(0, urlPossible.length - 1);
    let schedulePossible = args[0];
    let { is_nurl, nurl } = checkIsUrlAndGet(urlPossible);
    let { is_schedule, schedn, schedfull } = checkIsSchedule(schedulePossible);
    displayname = member.nickname;
    if (!displayname) {
        displayname = author.username;
    }

  //DONE GET URL, GET User Name
  //TODO HANDLE doubles
    console.log("CMD   : SET");
    console.log("ARGS  : ", args);

    let napchart;
    try {
        if (is_nurl) {
            napchart = await getNapchart(displayname, urlPossible);
        }
    }
    catch (err) {
        console.log(`ERR\t: Could not get napchart ${urlPossible + err}`);
        message.author.send(`Invalid napchart ${urlPossible}, or napchart API bugged`);
        return false;
    }

  //If schedule only, wipe chart
  if (args[0] === "none" && args.length == 1) {
    console.log("ACT   : ", "Remove napchart from database for " +author.username);
    upd = buildUserInstance();
    upd.currentScheduleChart = null;
    await saveUserSchedule(message, upd);
    msg = "Nap Chart has been removed for **" + displayname + "**.";
    console.log("MSG   : ", msg);
    if(!dry&&!silent){message.channel.send(msg);}
    return false;
  }

  //console.log("INFO  : ", is_nurl, is_schedule, args, args.length)
  if ((args.length === 2 && (!is_schedule || !(is_nurl || args[1] === "none"))) ||
      (!is_nurl && !is_schedule)) {
    msg = "Invalid `+set` format, use `+set [url]`, `+set [schedule]`, `+set [schedule] [url]` or see +help for details.";
    console.log("MSG   : ", msg);
    if(!dry&&!silent){message.channel.send(msg);}
    console.error("ERR>>>: ", "Set command was rejected with args", args);
    return false;
  }
  //Delete napchart for monos and randoms
  if(!is_nurl && is_schedule && (schedules[schedn].name == "Random" || schedules[schedn].name == "Mono")) {
    if (args.length == 2) {
      args[1] = "none";
    } else {
      args.push("none");
    }
  }

  let userUpdate = buildUserInstance();

  let result = await saveUserSchedule(message, userUpdate);

  fullmsg = "";
  msgopt = {};
  // We received Schedule change, process it:
  if (is_schedule) {
    ptag = ` [${schedfull}]`;
    if (member.nickname == null) {
      new_username = author.username;
    } else {
      new_username = member.nickname;
      ptag_start = new_username.lastIndexOf(' [');
      if (ptag_start != -1) {
	new_username = new_username.slice(0,ptag_start);
      }
    }
    lngt = new_username.length + ptag.length;
    if(lngt>32) {
      new_username = new_username.slice(0,32-lngt);
      msg = "Username had to be shortened because it was too long to fit the tag. Contact moderators if you want it changed.";
      console.log("MSG   : ", msg);
      if(!dry&&!silent){message.channel.send(msg);}
    }
    new_username = new_username + ptag;

    console.log("ACT   : ", "Change usrname for **" +displayname+ "** to "+new_username);
    if(!dry){member.setNickname(new_username);}
    msg = "Schedule set for " + author.tag + " to `" + args[0] + "`.";
    console.log("MSG   : ", msg);
    fullmsg += msg + "\n";

    let roles =  member.roles;
    roles = new Set(roles.keys());

    let newRole = schedules[schedn].category;
    let role = message.guild.roles.find(d => d.name === newRole);
    let attempt_role = null;
    let adaptedrole = message.guild.roles.find(d => d.name === "Currently Adapted");
    if (roles.has(adaptedrole.id)){
      roles.delete(adaptedrole.id);
      msg = member.user.tag + " is no longer adapted";
      if(!dry){message.channel.send(msg);}
    }
    if(schedules[schedn].name != "Naptation" && schedules[schedn].name != "Mono" && schedules[schedn].name != "Experimental") {
      let newAttemptRole = "Attempted-"+schedules[schedn].name;
      attempt_role = message.guild.roles.find(d => d.name === newAttemptRole);
    }
    Object.values(schedules).forEach(sch=>{
      if(message.guild.roles.find(d => d.name === sch.category)==null){
	console.log("WARN  : ", sch.category, "is not present");
      } else {
	roles.delete(message.guild.roles.find(d => d.name === sch.category).id);
      }
    });
    roles.add(role.id);
    if(schedules[schedn].name !== "Naptation" && schedules[schedn].name !== "Mono" && schedules[schedn].name !== "Experimental") {
      roles.add(attempt_role.id);
    }
    console.log("ACT   : ", "Change role for " +author.tag + " to "+newRole);
    if(!dry){member.setRoles(Array.from(roles));}
  } else {
    complete = false;
  }

  // We received Napchart, process it:
  if (is_nurl) {
    // Include http(s) when specifying URLs
    msg = "Nap Chart set for " + author.tag + " to " + nurl.href + ".";
    console.log("MSG   : ", msg);
    fullmsg += msg + "\n";
    rembed = await getOrGenImg(nurl, message, dry);
    msgopt = { embed: rembed };
  } else if (args.length === 2 && args[1] === "none") {
    console.log("ACT   : ", "Remove napchart from database for " +author.username);
    upd = buildUserInstance();
    upd.currentScheduleChart = null;
    await saveUserSchedule(message, upd);
    msg = "Nap Chart has been removed for **" + displayname + "**.";
    console.log("MSG   : ", msg);
    fullmsg += msg + "\n";
    if (args.length == 1) { complete = false; }
  } else {
    complete = false;
  }
  if(!dry&&!silent){message.channel.send(fullmsg, msgopt);}
  return complete;

  function buildUserInstance() {
    let userUpdate = {
      tag: author.tag,
      userName: author.username,
      updatedAt: new Date(message.createdTimestamp)
    };
    if (is_schedule) {
      userUpdate.currentScheduleName = schedfull;
    }
    if (is_nurl) {
      userUpdate.currentScheduleSleeps = napchart.sleeps;
      userUpdate.currentScheduleChart = urlPossible;
    }
    return userUpdate;
  }

  function checkIsUrlAndGet(urlPossible) {
    try {
      let nurl = url.parse(urlPossible);
      if ((nurl.host == "napchart.com" || nurl.host == "www.napchart.com") && (napchartPathRegex.test(nurl.pathname.substr(1)))) {
	return { is_nurl: true, nurl: nurl };
      }
    } catch (err) {
      // console.log("set image error: " + err);
      return { is_nurl: false };
    }
    return { is_nurl: false };
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
    }
    return { is_schedule: false };
  }

  async function saveUserSchedule(message, userUpdate) {
    let query = { id: author.id },
	options = { upsert: true, new: true, setDefaultsOnInsert: true };

    let result = null;
    try {
      result = await UserModel.findOneAndUpdate(query, userUpdate, options);
      saveHistories();
      let report = await ReportModel.findOne();
      if (report !== null) {
	ReportModel.create({'updatedAt': report.updatedAt})
	  .then(console.log)
	  .catch(console.error);
      } else {
	ReportModel.create()
	  .then(console.log)
	  .catch(console.error);
      }
    } catch (error) {
      console.log("error searching for User: ", error);
      if(!dry&&!silent){message.channel.send("Something done broke.  Call the fire brigade");}
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
          setAt: new Date(message.createdTimestamp)
        });
      }
      if ('currentScheduleChart' in userUpdate && userUpdate.currentScheduleChart != null) {
        result.historicScheduleCharts.push({
          url: userUpdate.currentScheduleChart,
          setAt: new Date(message.createdTimestamp)
        });
      }
      result.save();
    }
  }
}

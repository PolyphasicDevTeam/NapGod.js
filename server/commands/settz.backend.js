const url = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const ReportModel = require("./../models/report.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const schedules = require("./schedules").schedules;
const modifiers = require("./schedules").modifiers;

const napchartPathRegex = /^\w{5}$/


module.exports = {
  setInternal: function(args, message, dry, author=null, member=null) {
    if (author == null) { author = message.author; }
    if (member == null) { member = message.member; }
    if (author == null || member == null) {
      console.log("WARN>>: ", "Member or author no longer exists");
      return;
    }
    settz(args, message, dry, author, member, false);
  },
  setInternalPromise: function(args, message, dry, author=null, member=null, silent = true) {
    return new Promise(function (resolve, reject) {
      if (author == null) { author = message.author; }
      if (member == null) { member = message.member; }
      if (author == null || member == null) {
	console.log("WARN>>: ", "Member or author no longer exists");
	resolve(false);
      }
      resolve(settz(args, message, dry, author, member, silent));
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
	await settz(args, message, dry, author, member, false);
      } else {
	msg = "You need to provide a URL or a valid sleep cycle see +help for details.";
	console.log("MSG   : ", msg);
	if(!dry){message.channel.send(msg);}
      }
      return true;
    } else {
      return false;
    }
  })

};

function pad(number) {
  if (number<=99) { number = ("0"+number).slice(-2); }
  return number;
}
//Returns true if both schedule and napchart are set
//silent supresses dicord text output only, changes still take place
//(provided dry=false)
async function settz(args, message, dry, author, member, silent) {
  complete = true;
  let msg = "";

  console.log("CMD   : SETTZ");
  console.log("ARGS  : ", args);


  let userUpdate = buildUserInstance();

  let result = await saveUserTZ(message, userUpdate);

  function buildUserInstance() {
    let userUpdate = {
      tag: author.tag,
      userName: author.username,
      timezone: args[0]
    };
    return userUpdate;
  }
  function isValidTZ(tzmin){
    if (tzmin <= 840 && tzmin >= -720){
      return true;
    }
    else{
      return false;
    }
  }

  async function saveUserTZ(message, userUpdate) {
    let query = { id: author.id };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };

    let result = null;
    if (!isValidTZ(args[0])) {
      message.channel.send("Error: Invalid timezone. Valid timezones are between `-720`(UTC-12:00) and `840`(UTC+14:00)");
      return;
    }
    else{
    try {
      result = await UserModel.findOneAndUpdate(query, userUpdate, options);
      let report = await ReportModel.findOne();
    } catch (error) {
      console.log("error searching for User: ", error);
      if(!dry&&!silent){message.channel.send("Something done broke.  Call the fire brigade");}
      return;
    }
    return result;

    result.save();


    sign = Math.sign(args[0]);
    if (sign<0){
      sign = "-";
    }
    else{
      sign = "+";
    }
    tzmin = Math.abs(args[0]);
    hours = Math.floor(tzmin/60);
    minutes = tzmin - hours*60;
    message.channel.send("Timezone for " +
      member.displayName + " has been set to `"
      + "UTC" + sign + pad(hours) + ":" + pad(minutes) + "`");
    }
  }
}
//timeout
//tt

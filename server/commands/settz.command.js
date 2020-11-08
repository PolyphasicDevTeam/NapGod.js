const UserModel = require("./../models/user.model");
const { minToTZ } = require('./utility');

module.exports = {
  processSetTZ: (async function(command, message, args, dry=false) {
    if (command === "settz") {
      if (args.length == 1) {
	        author = message.author;
	        member = message.member;
          if (author === null || member === null) {
	           console.log("WARN>>: ", "Member or author no longer exists");
	           return false;
	        }
	        await settz(args, message, dry, author, member, false);
        }
        else {
	        msg = "Bad input format. Use `+settz [offset from UTC in minutes]`\n\
Example: `+settz 60` for `UTC+01:00`. Use negative numbers for the Western Hemisphere.";;
	        console.log("MSG   : ", msg);
	        if(!dry){message.channel.send(msg);}
          }
          return true;
          }
      else {
          return false;
          }
  })

};

function pad(number) {
  return ("0" + number).slice(-2);
}

function bold(s){
  return "**" + s + "**";
}

function buildUserInstance(args, author) {
  let userUpdate = {
    tag: author.tag,
    userName: author.username,
    timezone: args[0]
  };
  return userUpdate;
}

//Returns true if both schedule and napchart are set
//silent supresses dicord text output only, changes still take place
//(provided dry=false)
async function settz(args, message, dry, author, member, silent) {
  complete = true;
  let msg = "";

  console.log("CMD   : SETTZ");
  console.log("ARGS  : ", args);
  if (!isValidTZ(args[0])) {
    message.channel.send("Error: Invalid timezone. Valid timezones are between `-720` (UTC-12:00) and `840` (UTC+14:00)");
    return;
  }
  let userUpdate = buildUserInstance(args, author);

  let result = await saveUserTZ(message, userUpdate);

  async function saveUserTZ(message, userUpdate) {
    let query = { id: author.id };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };

    let result = null;
    try {
      result = await UserModel.findOneAndUpdate(query, userUpdate, options);
    } catch (error) {
      console.log("error searching for User: ", error);
      if(!dry&&!silent){message.channel.send("Something broke.  Call the fire brigade");}
      return;
    }
    let tzmin = args[0];
    message.channel.send("Timezone for " +
      bold(member.displayName) + " set to `" +
      minToTZ(tzmin) + "`");

    return result;

    result.save();

  }
}

function isValidTZ(tzmin){
  if (tzmin <= 840 && tzmin >= -720){
    return true;
  }
  else{
    return false;
  }
}

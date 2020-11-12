const UserModel = require("./../models/user.model");
const { minToTZ, bold, parseTZstr } = require('./utility');

module.exports = {
  processSetTZ: (function(command, message, args, dry=false) {
    if (command === "settz") {
      if (args.length == 1) {
	        author = message.author;
	        member = message.member;
          if (author === null || member === null) {
	           console.log("WARN>>: ", "Member or author no longer exists");
	           return false;
	        }
	        settz(args, message, dry, author, member, false);
        }
        else {
	        msg = "Bad input format. Use `+settz [UTC+/-XX]`\n\
Example: `+settz UTC+1` or `+settz UTC+5:30` or `+settz UTC-4`";
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


function buildUserInstance(args, author) {
  let userUpdate = {
    tag: author.tag,
    userName: author.username,
    timezone: parseTZstr(args[0])
  };
  return userUpdate;
}

async function settz(args, message, dry, author, member, silent) {
  complete = true;
  let msg = "";

  console.log("CMD   : SETTZ");
  console.log("ARGS  : ", args);
  if (!isValidTZ(parseTZstr(args[0]))) {
    message.channel.send("Error: Invalid timezone. Valid timezones are between `UTC-12:00` and `UTC+14:00`");
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
      if (!dry&&!silent) {
        message.channel.send("Something broke.  Call the fire brigade");
      }
      return;
    }
    let tzmin = parseTZstr(args[0]);
    message.channel.send("Timezone for " +
      bold(member.displayName) + " set to `" +
      minToTZ(tzmin) + "`");

    return result;
    //result.save();

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

const config = require("../../config.json");
const UserModel = require("./../models/user.model");

module.exports = {
  processFocus: function(command, message, args, dry=false){
    if (command === "rename"){
      console.log("CMD   : RENAME");
      console.log("ARGS  : ", args);
      if (args.length !== 0){
	rename(message, args, dry);
      } else {
	msg = "Valid options are `+rename [new name]`";
	console.log("MSG   : ", msg);
	if(!dry){message.channel.send(msg);}
      }
      return true;
    }
    return false;
  }
};

function extractTag(nickname) {
  let tagStart = nickname.lastIndexOf('[');
  let tag = '';
  if (tagStart != -1) {
    tag = nickname.slice(tagStart);
  }
  return tag;
}

async function rename(message, args, dry) {
  let msg = '';
  let name = args.join(' '); // invert operation. Todo: Need to be change when refactoring the entire code later
  let tag = (message.member.nickname !== null) ? extractTag(message.member.nickname) : '';
  name += ' ' + tag;
  if (name.length <= 32) {
    msg += await message.member.setNickname(name)
      .then(g => "Nickname has been set to " + name)
      .catch((err) => {
	console.log('ERR>>', err);
	return 'The nickname has not been set. Contact the admin';
      });
  } else {
    msg += "You can't set a name that long. The discord limit is 32 character (with the tag)";
  }
  console.log("MSG   : ", msg);
  if(!dry){message.channel.send(msg);}
}

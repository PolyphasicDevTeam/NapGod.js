const UserModel = require('./../models/user.model');
const config = require('../../config.json');
const { findMember } = require('./find');
const { executeFunction, minToTZ, bold } = require('./utility');

module.exports = {
  processGetTZ: function (command, message, args, dry = false) {
    if (command === 'gettz') {
      console.log('GETTZ', args);
      executeFunction(get, message, args, dry);
      return true;
    }
    return false;
  },
};

async function get(message, args, dry) {
  const memberIdentifier = message.content
    .slice(config.prefix.length + 'gettz'.length , message.content.length)
    .trim();
  console.log('INFO:  memberIdentifier: ', memberIdentifier);
  let member;
  if (memberIdentifier === '') {
    member = { value: message.member, found: true };
    console.log(
      `INFO:  user is the author message ${member.value.user.tag} -> ${member.value.id}`
    );
  } else {
    member = findMember(
      memberIdentifier,
      message.guild,
      message.mentions.users
    );
    if (!member.found) {
      console.log(member.msg);
      if (!dry) {
        await message.channel.send(member.msg);
      }
      return;
    } else {
      console.log(
        `INFO:  user found ${member.value.user.tag} -> ${member.value.id}`
      );
    }
  }
  const userDB = await UserModel.findOne({ id: member.value.user.id });
  if(userDB && userDB.timezone != null){
  let tzmin = userDB.timezone;
    message.channel.send("Timezone for " +
      bold(member.value.displayName) + " is `"
      + minToTZ(tzmin) + "`");
  }
  else{
    message.channel.send("Error: User " + bold(member.value.displayName) + " has not set a timezone.")
  }
}

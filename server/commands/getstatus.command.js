const UserModel = require('./../models/user.model');
const config = require('../../config.json');
const { findMember } = require('./find');
const { executeFunction, dateToStringSimple, minToTZ, bold } = require('./utility');

module.exports = {
  processGetTZ: function (command, message, args, dry = false) {
    if (command === 'status') {
      console.log('STATUS', args);
      executeFunction(get, message, args, dry);
      return true;
    }
    return false;
  },
};


async function get(message, args, dry) {
  const memberIdentifier = message.content
    .slice(config.prefix.length + 'status'.length , message.content.length)
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
  if(userDB && userDB.timezone){
    let tzmin = userDB.timezone;
    date = new Date(new Date().getTime() + tzmin * 60000)
    message.channel.send("Time for "  +
      bold(member.value.displayName) + " is `"+ dateToStringSimple(date) + " " + minToTZ(tzmin) + "`");
  }
  else{
    message.channel.send("Error: User " + bold(member.value.displayName) + " has not set a timezone.")
  }
}

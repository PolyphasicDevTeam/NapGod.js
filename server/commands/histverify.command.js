const UserModel = require("./../models/user.model");
const Discord = require('discord.js')
const { findMember } = require('./find');
const schedules = require("./schedules").schedules;
const modifiers = require("./schedules").modifiers;
const { tick, bold, dateToStringSimple, isValidDate } = require('./utility');

const cmds = ["histverify", "histver", "verify"];

module.exports = {
  processHistoryVerify: function (command, message, args, dry = false) {
    if (cmds.includes(command)) {
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
      );
      if (!permissions) {
        message.channel.send('You do not have privileges to execute this command. Only Moderators and Admins are allowed to use `+histverify`');
      }
      else if (args.length == 1) {
        verify(message, args, dry, cmd = command);
        return true;
    }
      else {
        message.channel.send("Correct usage: `+histverify [user]`")
      }
  }
  else {
    return false;
  }
}
};

async function verify(message, args, dry, cmd) {
  let memberIdentifier = args.join(" ").trim();

  let member = findMember(
      memberIdentifier,
      message.guild,
      message.mentions.users
    );

    console.log('INFO:  memberIdentifier: ', memberIdentifier);
    if (!member.found) {
      console.log(member.msg);
      if (!dry) {
        await message.channel.send(member.msg);
      }
      return;
    } else {
      console.log(`INFO:  user found ${member.value.user.tag} -> ${member.value.id}`);
    }

  const userDB = await UserModel.findOne({ id: member.value.user.id });


  console.log("CMD   : HISTVERIFY");
  console.log("ARGS  : ", args);

  let userUpdate = {
    tag: member.value.user.tag,
    userName: member.value.user.username,
    scheduleVerified: true,
  };

  let result = await saveUserHistory(message, userUpdate);

  async function saveUserHistory(message, userUpdate) {
    let query = { id: member.value.user.id };
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
    message.channel.send("Schedule history for " + bold(member.value.displayName) + " is now verified.");

    return result;

  }
}

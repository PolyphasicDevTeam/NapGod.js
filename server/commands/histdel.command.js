const UserModel = require("./../models/user.model");
const Discord = require('discord.js')
const { findMember } = require('./find');
const schedules = require("./schedules").schedules;
const modifiers = require("./schedules").modifiers;
const { tick, bold, dateToStringSimple } = require('./utility');

const cmds = ["histdel", "histrm"];

module.exports = {
  processHistoryDelete: function (command, message, args, dry = false) {
    if (cmds.includes(command)) {
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
      );
      del(message, args, dry, cmd = command, permissions);
      return true;
    }
    return false;
  },
};

async function del(message, args, dry, cmd, permissions) {
  let index = args[0];
  target = args.slice(1).join(" ").trim();
  console.log(target);
  const memberIdentifier = target ? target : null;

  let member;
  if (memberIdentifier === null) {
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
  }

  if (member.value != message.member && !permissions){
    message.channel.send('You do not have privileges to execute this command. Only Moderators and Admins are allowed to use `+histadd` on other users');
    return;
  }


  const userDB = await UserModel.findOne({ id: member.value.user.id });


  let history = userDB.historicSchedules;

  if (index >= history.length || index < 0) {
    message.channel.send("Index is out of range.")
    return;
  }
  let deleted = history.splice(index, 1)[0];

  console.log("CMD   : HISTDEL");
  console.log("ARGS  : ", args);

  let msg = "Schedule history for " + bold(member.value.displayName) + " has been edited.";
  msg += "\nRemoved: " + tick(index + " " + deleted.name + " " + dateToStringSimple(new Date(deleted.setAt)).slice(0,10));

  if (userDB.scheduleVerified) {
    msg += "\nSchedule history for " + bold(member.value.displayName) + " is no longer verified. Contact a moderator to have it verified again.";
  }

  // +histadd
  let userUpdate = {
    tag: member.value.user.tag,
    userName: member.value.user.username,
    historicSchedules: history,
    scheduleVerified: false
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
    message.channel.send(msg);

    return result;

  }
}

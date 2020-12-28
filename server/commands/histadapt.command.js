const UserModel = require("./../models/user.model");
const Discord = require('discord.js')
const { findMember } = require('./find');
const schedules = require("./schedules").schedules;
const modifiers = require("./schedules").modifiers;
const { tick, bold, dateToStringSimple, isValidDate } = require('./utility');
const { prefix } = require("../../config.json");

const cmds = ["histadapt", "historyadapt", "histadapted", "historyadapted"];

module.exports = {
  processHistory: function (command, message, args, dry = false) {
    if (cmds.includes(command)) {
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
      );
      if (!permissions) {
        message.channel.send('You do not have privileges to execute this command. Only Moderators and Admins are allowed to use `+histadapt`');
      }
      else if (args.length == 3) {
        adapt(message, args, cmd = command);
        return true;
      }
      else {
        message.channel.send("Correct usage: "
          + tick(prefix + "histadapt [index] [yyyy-mm-dd] [user]"));
      }
  }
  else {
    return false;
  }
}
};

async function adapt(message, args, cmd) {
  let index = args[0];
  let date = args[1]
  let memberIdentifier = args.slice(2).join(" ").trim();
  if (!isValidDate(date)) {
    message.channel.send("Date is invalid. Please use yyyy-mm-dd, like 2020-11-25");
  }

  let member = findMember(
      memberIdentifier,
      message.guild,
      message.mentions.users
    );

    console.log('INFO:  memberIdentifier: ', memberIdentifier);
    if (!member.found) {
      console.log(member.msg);
      message.channel.send(member.msg);
      return;
    } else {
      console.log(`INFO:  user found ${member.value.user.tag} -> ${member.value.id}`);
    }

  const userDB = await UserModel.findOne({ id: member.value.user.id });

  let history = userDB.historicSchedules;
  if (index >= history.length || index < 0) {
    message.channel.send("Index is out of range.")
    return;
  }

  let adaptDate = new Date(Date.parse(date));
  if (!checkIsValid(adaptDate, index, history, message)) {
    return;
  }

  console.log("CMD   : HISTADAPT");
  console.log("ARGS  : ", args);

  history[index].adaptDate = adaptDate;
  userDB.save();

  message.channel.send(
    "Schedule history for " + bold(member.value.displayName)
    + " has been edited.\n" + "Adapted: " + tick((parseInt(index) + 1 ) + " "
    + item.name + " " + dateToStringSimple(new Date(item.setAt)).slice(0,10))
  );
}

function checkIsValid(adaptDate, index, history, message) {
  history.sort((a,b) => (a.setAt > b.setAt) ? 1 : -1);

  // can't be adapted in the future
  if (adaptDate > new Date()){
    message.channel.send("Adapted cannot be set in the future.")
    return false;
  }

  // can't set adapted before schedule start date
  if (adaptDate < history[index].setAt) {
    message.channel.send("Adapted cannot be set before schedule start date.")
    return false;
  }

  return true;
}

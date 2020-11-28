const UserModel = require("./../models/user.model");
const Discord = require('discord.js')
const { findMember } = require('./find');
const schedules = require("./schedules").schedules;
const modifiers = require("./schedules").modifiers;
const { tick, bold, dateToStringSimple, isValidDate } = require('./utility');

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
        adapt(message, args, dry, cmd = command);
        return true;
    }
      else {
        message.channel.send("Correct usage: `+histadapt [index] [yyyy-mm-dd] [user]`")
      }
  }
  else {
    return false;
  }
}
};

async function adapt(message, args, dry, cmd) {
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
      if (!dry) {
        await message.channel.send(member.msg);
      }
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

  let item = {
    name: history[index].name,
    adapted: true,
    setAt: new Date(Date.parse(date))
  };

  let scheduleMatch = (sched) => (sched.name == item.name && sched.setAt == item.setAt && sched.adapted == item.adapted);
  if (!checkIsValid(item, index, history, message)) {
    return;
  }

  console.log("CMD   : HISTADAPT");
  console.log("ARGS  : ", args);

  let userUpdate = {
    tag: member.value.user.tag,
    userName: member.value.user.username,
    historicSchedules: history
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
    message.channel.send("Schedule history for " + bold(member.value.displayName) + " has been edited.\n" + "Adapted: " +
      tick((parseInt(index) + 1 ) + " " + item.name + " " + dateToStringSimple(new Date(item.setAt)).slice(0,10)));

    return result;

  }
}

function checkIsValid (item, index, history, message) {

  history.push(item);
  history.sort((a,b) => (a.setAt > b.setAt) ? 1 : -1);
  let scheduleMatch = (sched) => (sched.name == item.name && sched.setAt == item.setAt);
  let newIndex = history.findIndex(scheduleMatch);

  // can't be adapted in the future
  if (item.setAt > new Date()){
    message.channel.send("Adapted cannot be set in the future.")
    return false;
  }

  if (newIndex != parseInt(index) + 1) {
    console.log(newIndex, index);
    message.channel.send("There are intervening schedules. Please delete them with `+histdel` before proceeding.");
    return false;
  }
  // can't set adapted before schedule start date
  if (item.setAt < history[index].setAt) {
    message.channel.send("Adapted cannot be set before schedule start date.")
    return false;
  }

  return true;
}

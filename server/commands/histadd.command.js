const UserModel = require("./../models/user.model");
const Discord = require('discord.js')
const { findMember } = require('./find');
const schedules = require("./schedules").schedules;
const modifiers = require("./schedules").modifiers;
const { tick, bold, dateToStringSimple, isValidDate } = require('./utility');

const cmds = ["histadd"];

module.exports = {
  processHistoryAdd: function (command, message, args, dry = false) {
    if (cmds.includes(command)) {
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
      );
      add(message, args, dry, cmd = command, permissions);
      return true;
    }
    return false;
  },
};

async function add(message, args, dry, cmd, permissions) {
  let { is_schedule, schedn, schedfull } = checkIsSchedule(args[0]);
  let start = args[1];
  schedule = schedfull;
  if (!is_schedule) {
    message.channel.send("Bad schedule name.");
    return;
  }
  target = args.slice(2).join(" ").trim();
  console.log(target);
  const memberIdentifier = target ? target : null;

  if (!isValidDate(start)) {
      message.channel.send("Bad date format. Use yyyy-mm-dd.");
      return;
  }


  if (Date.parse(start) > new Date()) {
      message.channel.send("Cannot set schedule in the future.");
      return
  }
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


  let item = {
    name: schedule,
    setAt: new Date(Date.parse(start)),
    adapted: false,
    maxLogged: 0
  }

  history.push(item);
  history.sort((a,b) => (a.setAt > b.setAt) ? 1 : -1);
  console.log(history);

  let scheduleMatch = (sched) => (sched.name == item.name && sched.setAt == item.setAt);

  console.log("CMD   : HISTADD");
  console.log("ARGS  : ", args);

  let msg = "Schedule history for " + bold(member.value.displayName) + " has been edited.";
  msg += "\nAdded: " + tick(history.findIndex(scheduleMatch) + " " + item.name + " " + dateToStringSimple(item.setAt).slice(0,10));

  if (userDB.scheduleVerified) {
    msg += "\nSchedule history for " + bold(member.value.displayName) + " is no longer verified. Contact a moderator to have it verified again."
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

function checkIsSchedule(schedulePossible) {
  if (schedulePossible) {
    const schedp_arr = schedulePossible.trim().split(/-+/g);
    const schedn = schedp_arr[0].toLowerCase();

    if (Object.keys(schedules).includes(schedn)) {
if (schedp_arr.length == 2) {
  const schedmod = schedp_arr[1].toLowerCase();
  if (Object.keys(modifiers).includes(schedmod)) {
    return { is_schedule: true, schedn, schedfull: schedules[schedn].name + "-" + modifiers[schedmod].name };
  }
} else if (schedp_arr.length == 1) {
  return { is_schedule: true, schedn, schedfull: schedules[schedn].name };
}
    }
  }
  return { is_schedule: false };
}

const UserModel = require('./../models/user.model');
const config = require('../../config.json');
const Discord = require('discord.js')
const { findMember } = require('./find');
const request = require('request');
const { executeFunction, dateToStringSimple, minToTZ, bold, h_n_m, tick } = require('./utility');

const api_url = config.nc_endpoint;
const per_page = 12;

const cmds = ["hist", "history", "historyfull", "histfull"];

module.exports = {
  processHistory: function (command, message, args, dry = false) {
    if (cmds.includes(command)) {
      console.log(command, args);
      hist(message, args, cmd = command);
      return true;
    }
    return false;
  },
};


async function hist(message, args, cmd) {
  let full = cmd.includes("full");

  // If the first arg is not empty, and is not a number, it is a member name.
  const memberIdentifier = (args[0] && isNaN(args[0])) ? args[0] : null;

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
      await message.channel.send(member.msg);
      return;
    } else {
      console.log(`INFO:  user found ${member.value.user.tag} -> ${member.value.id}`);
    }
  }
  const userDB = await UserModel.findOne({ id: member.value.user.id });
  console.log(userDB);
  if (userDB && userDB.historicSchedules != null) {
    let schedules = [];
    let schedule_starts = [];
    let adapted = [];
    let prev_adapted = false;
    let title = (full ? "Full" : "Summarised") + " schedule history for ";

    let title2 = "**This schedule history is " + (userDB.scheduleVerified ? "" : "NOT ") + "verified.**"

    // Do not use logic to simplify history if in full mode:
    if (full){
      let i = 0;
      userDB.historicSchedules.forEach(schedule => {
            console.log(i);
            schedules.push(tick(i) + ' ' + schedule.name);
            schedule_starts.push(tick(dateToStringSimple(schedule.setAt).slice(0,10)));
            adapted.push(tick(schedule.adaptDate ?
              dateToStringSimple(schedule.adaptDate).slice(0,10) : "No"));
            i += 1;
        });
    }
    else {
    userDB.historicSchedules.forEach(schedule => {
        // If this schedule is not the same as the previous, add it.
        if (schedule.name != schedules[schedules.length - 1]) {
          schedules.push(schedule.name);
          schedule_starts.push(tick(dateToStringSimple(schedule.setAt).slice(0,10)));
          adapted.push(tick(schedule.adaptDate ?
            dateToStringSimple(schedule.adaptDate).slice(0,10) : "No"));
        }
        // If the previous schedule is adapted and this one is not, add the new attempt.
        else if (prev_adapted && !schedule.adapted) {
            schedules.push(schedule.name);
            schedule_starts.push(tick(dateToStringSimple(schedule.setAt).slice(0,10)));
            adapted.push(tick("No"));
        }
        prev_adapted = schedule.adaptDate;
        // Merge consecutive non-adapted identical schedules.
      });
    }
    let page = (args[0] && args[1]) ? args[1] : args[0];
    page = isNaN(page) ? 1 : page;
    let n_pages = Math.ceil(schedules.length / per_page);
    let start = (page - 1) * per_page;
    let end = page * per_page;
    console.log("Page " + page)
    if (start >= schedules.length || page < 1) {
      message.channel.send("No data on page " + page + ". There are only " + n_pages + " pages in total.");
      console.log("Page out of bound")
      return;
    }
    schedules = schedules.reverse();
    schedule_starts = schedule_starts.reverse();
    adapted = adapted.reverse();

    let embed = new Discord.RichEmbed()
	    .setColor(member.value.displayColor)
      .setDescription(title2 + "\nPage " + page + " of " + n_pages)
      .setFooter(`ID: ${member.value.user.id}`)
	    .setTitle(title + member.value.user.tag)
	    .setTimestamp()
      .addField("Schedule", schedules.slice(start, end), true)
      .addField("Start Date", schedule_starts.slice(start, end), true)
      .addField("Adapted", adapted.slice(start, end), true);

    message.channel.send(embed);
  }
  else {
    message.channel.send("Error: User " + bold(member.value.displayName) + " has not set a schedule.")
  }
}

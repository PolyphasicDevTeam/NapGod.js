const UserModel = require('./../models/user.model');
const config = require('../../config.json');
const Discord = require('discord.js')
const { findMember } = require('./find');
const request = require('request');
const { executeFunction, dateToStringSimple, minToTZ, bold, h_n_m, tick } = require('./utility');

const cmd = "hist"

const api_url = config.nc_endpoint;

module.exports = {
  processHistory: function (command, message, args, dry = false) {
    if (command === cmd) {
      console.log(cmd, args);
      executeFunction(get, message, args, dry);
      return true;
    }
    return false;
  },
};


async function get(message, args, dry) {
  const memberIdentifier = message.content
    .slice(config.prefix.length + cmd.length , message.content.length)
    .trim();
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
  const userDB = await UserModel.findOne({ id: member.value.user.id });
  if (userDB && userDB.historicSchedules != null) {
    let schedules = [];
    let schedule_starts = [];
    let adapted = [];
    let prev_adapted = false;

    let embed = new Discord.RichEmbed()
	    .setColor(member.value.displayColor)
      .setFooter(`ID: ${member.value.user.id}`)
	    .setTitle('Summarised schedule history for ' + member.value.user.tag)
	    .setTimestamp()

    console.log(userDB.historicSchedules)
    userDB.historicSchedules.forEach(schedule => {
        // If this schedule is not the same as the previous, add it.
        if (schedule.name != schedules[schedules.length - 1]) {
          schedules.push(schedule.name);
          schedule_starts.push(dateToStringSimple(schedule.setAt).slice(0,10));
          adapted.push(schedule.adapted ? "Yes" : "No");
        }
        // If the previous schedule is adapted and this one is not, add the new attempt.
        else if (prev_adapted && !schedule.adapted) {
            schedules.push(schedule.name);
            schedule_starts.push(dateToStringSimple(schedule.setAt).slice(0,10));
            adapted.push("No");
        }
        // If the previous schedule is not adapted and this one is, add the date of adaptation to the previous one.
        else if (!prev_adapted && schedule.adapted) {
            adapted[adapted.length - 1 ] = dateToStringSimple(schedule.setAt).slice(0,10);
        }
        prev_adapted = schedule.adapted;
        // Merge consecutive non-adapted identical schedules.
      });

    embed.addField("Schedule", schedules, true)
         .addField("Started", schedule_starts, true)
         .addField("Adapted", adapted, true);

    message.channel.send(embed);
  }
  else {
    message.channel.send("Error: User " + bold(member.value.displayName) + " has not set a schedule.")
  }
}

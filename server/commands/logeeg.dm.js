const config = require("../../config.json");
const Discord = require('discord.js');
const _ = require("lodash");

let currentUsers = [];

const timeout = 3600;
const timeoutMessage = 'Timeout: the process was aborted.';
const abortMessage = 'Process was aborted.';
const logEegCMD = 'logeeg';
const logsChannelName = 'adaptation_logs';

module.exports = {
  processlogEeg: function(command, message, args, dry=false) {
    if (command === logEegCMD) {
      logEeg(message, dry);
      return true;
    }
    return false;
  }
};

async function logEeg(message, dry = false) {
  console.log(`CMD   : ${logEegCMD.toUpperCase()}`);

  const member = getMember(message);
  if (member) {
    if (currentUsers.includes(message.author.id)) {
      return true;
    }
    let collected;

    let botMessage;
    try {
      botMessage = await message.author.send('Send your EEG here. Its optional comment will also be posted. If you want to abort, wait an hour or answer here with `abort`.');
    }
    catch (err) {
      console.warn(`WARN\t: Couldn't send message to ${message.author.username}: ${err}`);
      if (message.channel.name != logsChannelName) {
        message.channel.send(`${message.author}: \`+logEeg\` cannot work if I cannot DM you.`).catch(console.warn);
      }
      return true;
    }

    currentUsers.push(message.author.id);

    let qSleepTracker = {name: "sleep tracker", answer: "", attachment: null};
    if (hasRole(member, 'Sleep Tracker')) {
      if (!await processqSleepTracker(message, qSleepTracker)) {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
        return true;
      }
    }
    else {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      message.author.send("You need the Sleep Tracker role to post EEGs.");
      return true;
    }

    if (!qSleepTracker.attachment) {
      message.author.send("No EEG attachment found, please try again.");
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }

    if (dry) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
    if (qSleepTracker.attachment) {
      getChannel(message, logsChannelName).send(`${message.author} EEG\n` + qSleepTracker.answer, qSleepTracker.attachment);
    }
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
  } else {
    message.author.send('You must join the Polyphasic Sleeping server if you want to post adaptation logs.');
  }
  return true;
}

async function collectFromUser(author, channel, step) {
  try {
    let collected = await channel.awaitMessages(x => x.author.id === author.id, { maxMatches: 1, time: timeout * 1000, errors: ['time'] });
    if (collected.first().content.toLowerCase() === 'abort') {
      author.send('Aborted.');
      return null;
    }
    return collected.first();
  }
  catch (e) {
    console.log("WARN\t: ", `Timeout waiting for answer from ${author.username} during step ${step.name}`);
    author.send(timeoutMessage);
    return null;
  }
}

async function processqSleepTracker(message, qSleepTracker) {
  if (!(collected = await collectFromUser(message.author, message.channel, qSleepTracker))) {
    return false;
  }
  qSleepTracker.attachment = collected.attachments.size > 0 ? new Discord.Attachment(collected.attachments.first().url) : null;
  qSleepTracker.answer = collected.content ? collected.content : "";
  return true;
}

function getMember(message) {
  const guild = getGuild(message);
  const userId = message.author.id;
  return guild.members.find(member => member.user.id === userId);
}

function getChannel(message, channelName) {
  const guild = getGuild(message);
  return guild.channels.find(channel => channel.name === channelName);
}

function getGuild(message) {
  return message.client.guilds.first();
}

function hasRole(member, role) {
  return member.roles.find(role => role.name == role);
}

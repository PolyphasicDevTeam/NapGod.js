const config = require("../../config.json");
const Discord = require('discord.js');
require('./log.tools.js')();

let currentUsers = [];

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
      botMessage = await message.author.send('You can send your EEG. Its comment will also be posted (optional). If you want to abort, wait an hour or answer with `abort` or `X`.');
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
      message.author.send("No EEG attachment found, please use the command again and then attach your EEG file.");
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

const config = require("../../config.json");
const Discord = require('discord.js');
require('./log.tools.js')();

let currentUsers = [];

const freelogCMD = 'freelog';
const logsChannelName = 'adaptation_logs';

const qSFLagreement_sanity = 'Please answer with either `y` or `n`.';
const qSFLagreement_regex = /^[yYnN]$/;

module.exports = {
  processFreelog: function(command, message, args, dry=false) {
    if (command === freelogCMD) {
      freelog(message, dry);
      return true;
    }
    return false;
  }
};

async function freelog(message, dry=false) {
  console.log(`CMD   : ${freelogCMD.toUpperCase()}`);
  const member = getMember(message);
  if (member) {
    if (currentUsers.includes(message.author.id)) {
      return true;
    }
    let collected;


    let botMessage;
    try {
      botMessage = await message.author.send('Write your adaptation log here. If you want to abort, wait an hour or answer here with `abort`.');
    }
    catch (err) {
      console.warn(`WARN\t: Couldn't send message to ${message.author.username}: ${err}`);
      if (message.channel.name != logsChannelName) {
        message.channel.send(`${message.author}: \`+freelog\` cannot work if I cannot DM you.`).catch(console.warn);
      }
      return true;
    }

    currentUsers.push(message.author.id);

    if (!(collected = await collectFromUser(message.author, botMessage.channel, "freelog"))) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }

    let qSleepTracker = {name: "sleep tracker", answer: "", attachment: null};
    if (hasRole(member, 'Sleep Tracker')) {
      if (!await processqSleepTracker(message, qSleepTracker)) {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
        return true;
      }
    }

    let displayName = member.nickname;
    if (!displayName) {
      displayName = message.author.username;
    }
    let colorRole = member.roles.filter(r => ['Nap only', 'Everyman', 'Dual Core', 'Tri Core', 'Biphasic', 'Experimental'].includes(r.name)).first();
    const color = colorRole ? colorRole.color : '#ffffff';

    const embed = new Discord.RichEmbed()
      .setColor(color)
      .setTitle('Freelog')
      .setAuthor(displayName, message.author.avatarURL)
      .setTimestamp()
      .setDescription(collected.content);

    if (dry) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }

    message.author.send(embed);
    let qConfirm = {name: 'log: confirm sending', message: "A preview of how the bot is going to edit the log can be seen below. Write `y` to confirm the edit, or `n` to abort.",
      parse: c => qSFLagreement_regex.test(c) ? "" : qSFLagreement_sanity, answer: ""};
    if (!await processqGeneric(message, qConfirm)) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
    if (qConfirm.answer.toLowerCase() === 'n') {
      message.author.send('Aborted.');
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
    getChannel(message, logsChannelName).send(embed);
    if (qSleepTracker.attachment) {
      getChannel(message, logsChannelName).send(`${message.author} EEG\n` + qSleepTracker.answer, qSleepTracker.attachment);
    }
    message.author.send("Thank you!");
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
  } else {
    message.author.send('You must join the Polyphasic Sleeping server if you want to post adaptation logs.');
  }
  return true;
}

const config = require("../../config.json");
const Discord = require('discord.js');
const _ = require("lodash");

let currentUsers = [];

const timeout = 3600;
const timeoutMessage = 'Timeout: the process was aborted.';
const abortMessage = 'Process was aborted.';
const freelogCMD = 'freelog';
const logsChannelName = 'adaptation_logs';

const qSleepTracker_message = 'If you have an EEG graph you want to include, please post it now, otherwise write ”X”.';

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
  let botMessage = await message.author.send(qSleepTracker_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, qSleepTracker))) {
    return false;
  }
  qSleepTracker.attachment = collected.attachments.size > 0 ? new Discord.Attachment(collected.attachments.first().url) : null;
  qSleepTracker.answer = collected.content ? collected.content : "";
  return true;
}

async function processqGeneric(message, q) {
  let botMessage = await message.author.send(q.message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q, collected => q.parse(collected.content)))) {
    return false;
  }
  q.answer = collected.content.toLowerCase();
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

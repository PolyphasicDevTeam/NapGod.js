const config = require("../../config.json");
const Discord = require('discord.js');
const _ = require("lodash");

let currentUsers = [];

const timeout = 500;
const timeoutMessage = 'Timeout: the process was aborted.';
const abortMessage = 'Process was aborted.';
const freelogCMD = 'freelog';
const logsChannelName = 'adaptation_logs';

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
  // let roles =  message.member.roles;
  // roles = new Set(roles.keys());
  // let mods = message.guild.roles.find("name", "Moderator").id;
  // let admins = message.guild.roles.find("name", "Admins").id;
  // permissions = false;
  // if (roles.has(mods) || roles.has(admins)) {
  //   permissions = true;
  // }
  // if (!permissions) {
  //   msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+freelog`";
  //   console.log("MSG   : ", msg);
  //   if (!dry) { message.channel.send(msg); }
  //   return true;
  // }
  const member = getMember(message);
  if (member) {
    if (currentUsers.includes(message.author.id)) {
      return true;
    }
    let collected;


    let botMessage;
    try {
      botMessage = await message.author.send('Write your adaptation log here. If you want to abort, wait a few minutes or answer here with the letter `x`.');
    }
    catch (err) {
      console.warn(`WARN\t: Couldn't send message to ${message.author.username}: ${err}`);
      if (message.channel.name != logsChannelName) {
        message.channel.send(`${message.author}: \`+freelog\` cannot work if I cannot DM you.`).catch(console.warn);
      }
      return true;
    }

    currentUsers.push(message.author.id);
    try {
      collected = await botMessage.channel.awaitMessages(x => x.author.id === message.author.id, { maxMatches: 1, time: timeout * 1000, errors: ['time'] });
    }
    catch (e) {
      console.log("LOG\t: ", `Timeout waiting for answer from ${message.author.username} during freelog`);
      message.author.send(timeoutMessage);
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }

    if (collected.first().content.toLowerCase() === "x") {
      console.log("LOG\t: ", `Freelog aborted from ${message.author.username}`);
      message.author.send(abortMessage);
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
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
      .setDescription(collected.first().content)
      .setTimestamp();

    console.log("MSG   : ", `Printing user input to #${logsChannelName}`);
    if (dry) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
    getChannel(message, logsChannelName).send(embed);
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
  } else {
    message.author.send('You must join the Polyphasic Sleeping server if you want to post adaptation logs.');
  }
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

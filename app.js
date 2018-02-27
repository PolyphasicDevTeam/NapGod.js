const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

var mongoose = require('mongoose');
// mongoose.connect('mongodb://database:27017/napgod');
mongoose.connect('mongodb://localhost:27017/napgod');

const { processCommands } = require("./server/command.ctrl");
const { processDevCommands } = require("./server/devCommand.ctrl")(client);

client.on("message", message => {
  //Ignore other bots and messages that do not start with prefix
  if (message.author.bot) return;

  const args = getArgs(message);
  const command = args.shift().toLowerCase();

  if (isDevPrefix(message)) {
    processDevCommands(command, message, args);
  } else if (isValidPrefix(message)) {
    processCommands(command, message, args);
  }
});

function isValidPrefix(message) {
  return message.content.indexOf(config.prefix) === 0;
}

function isDevPrefix(message) {
  return message.content.indexOf(config.devPrefix) === 0;
}

function getArgs(message) {
  return message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g);
}

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(
    `Bot has started, with ${client.users.size} users, in ${
      client.channels.size
    } channels of ${client.guilds.size} guilds.`
  );
  client.user.setActivity(config.prefix + "help");
});

client.on("guildCreate", guild => {
  console.log(
    `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${
      guild.memberCount
    } members!`
  );
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.login(config.token);

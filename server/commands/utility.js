const config = require('../../config.json');

const { RichEmbed } = require('discord.js');
function cutAt(string, nbMax, limitChar = '') {
  if (string.length > nbMax) {
    string = string.slice(0, nbMax);
    if (limitChar !== '') {
      string = string.slice(0, string.lastIndexOf(limitChar));
    }
    string += '...';
  }
  return string;
}

function buildEmbedError(error) {
  let embed = new RichEmbed();
  embed.setTitle(error.name);
  embed.setDescription(error.stack);
  embed.setColor('#FF0000');
  embed.setTimestamp();
  return embed;
}

async function sendError(error, message, dry = false) {
  try {
    console.log(error);
    if (!dry) {
      let channel = message.guild.channels.get(config.logErrorChannelID);
      if (channel === undefined) {
        channel = message.channel;
        await message.channel.send('Log channel not found. Dumping error here');
      }
      await channel.send(buildEmbedError(error, channel));
    }
  } catch (e) {
    console.log(error);
  }
}

async function executeFunction(fn, message, args, dry = false) {
  try {
    await fn(message, args, dry);
  } catch (e) {
    console.log('?');
    await sendError(e, message, dry);
  }
}

function dateToStringSimple(date) {
  const dateISO = date.toISOString();
  return dateISO.replace('T', ' ').substring(0, dateISO.indexOf('.'));
}

module.exports = {
  cutAt,
  executeFunction,
  dateToStringSimple,
};

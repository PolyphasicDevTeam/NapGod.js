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

// https://stackoverflow.com/a/1026087/8040287
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function toReadableString(string, sep = '_') {
  return string
    .trim()
    .toLowerCase()
    .split(sep)
    .map((d) => capitalizeFirstLetter(d))
    .join(' ');
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

function h_n_m(minutes) {
  minutes = Math.trunc(minutes);
  const hours = Math.trunc(minutes / 60);
  minutes = minutes % 60;
  return hours + 'h ' + minutes + 'm';
}
function pad(number) {
  return ("0" + number).slice(-2);
}

function bold(s){
  return "**" + s + "**";
}

function tick(s){
  return "`" + s + "`";
}

function minToTZ(tzmin){
  let sign = tzmin < 0 ? "-" : "+";
  tzmin = Math.abs(tzmin);
  hours = Math.floor(tzmin / 60);
  minutes = tzmin - hours * 60;
  return "UTC" + sign + pad(hours) + ":" + pad(minutes)
}

function parseTZstr(s){
  let tzhours;
  let tzsign = 1;
  let tzhm = null;
  if (s.includes("UTC") || s.includes("utc")){
    s = s.slice(3);
  }
  if (s.includes("Z") || s.includes("z")){
    s = s.slice(1);
  }
  if (s.startsWith("+")){
    s = s.slice(1);
  }
  else if(s.startsWith("-")){
    tzsign = -1;
    s = s.slice(1);
  }

  if (s.includes(":")){
    tzhm = s.split(":");
  }
  else if (s.length == 4){
    tzhm = [s.slice(0,2), s.slice(2,4)];
  }
  else if (s.length == 3){
    tzhm = [s.slice(0,1), s.slice(1,3)];
  }

  if (tzhm){
    tzhours = parseInt(tzhm[0]);
    tzhours += parseInt(tzhm[1]) / 60;
  }
  else{
    tzhours = parseInt(s);
  }
  return 60 * (tzhours * tzsign);
}

module.exports = {
  cutAt,
  executeFunction,
  dateToStringSimple,
  sendError,
  h_n_m,
  toReadableString,
  pad,
  bold,
  tick,
  minToTZ,
  parseTZstr
};

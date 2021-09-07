const { URL } = require('url');
const _ = require('lodash');
const UserModel = require('./../models/user.model');
const { getOrGenImg, makeNapchartImageUrl } = require('./../imageCache');
const config = require('../../config.json');
const { findMember } = require('./find');
const { executeFunction, dateToStringSimple } = require('./utility');

module.exports = {
  processGet: function (command, message, args, dry = false) {
    if (command === 'get') {
      console.log('GET', args);
      executeFunction(get, message, args, dry);
      return true;
    }
    return false;
  },
};

const timeCut = [
  { v: 86400000, k: 'day' },
  { v: 3600000, k: 'hour' },
  { v: 60000, k: 'minute' },
];

function diffTimeCut(d1, d2 = new Date()) {
  let i = 0;
  let delta = d2 - d1;
  let res;
  while (i < timeCut.length && !(res = Math.floor(delta / timeCut[i].v))) {
    i++;
  }
  let resUnit = timeCut[Math.min(i, timeCut.length - 1)].k;
  if (res > 1 || res === 0) {
    resUnit += 's';
  }
  return `${res} ${resUnit}`;
}

async function sendNapchart(message, res, member, dry) {
  console.log(res);
  if (
    res &&
    res.currentScheduleChart !== undefined &&
    res.currentScheduleChart !== null
  ) {
    const dateChart = new Date(res.updatedAt);
    const dateChartString = dateToStringSimple(dateChart);
    const deltaChart = diffTimeCut(dateChart);
    if (!dry) {
      let emb = await getOrGenImg(res.currentScheduleChart, message, dry);
      emb.setColor(member.displayColor);
      emb.setAuthor(member.user.tag, member.avatarURL);
      emb.setDescription(
        `Napchart for **${member}** (since ${dateChartString}) (${deltaChart}):
 ${emb.url}`
      );
      emb.setTimestamp();
      if (res.currentScheduleName !== undefined) {
        const dateSchedule = new Date(
          res.historicSchedules[res.historicSchedules.length - 1].setAt
        );
        const dateSchedulString = dateToStringSimple(dateSchedule);
        const deltaSchedule = diffTimeCut(dateSchedule);
        emb.addField(
          'Schedule',
          `${res.currentScheduleName} (since ${dateSchedulString}) (${deltaSchedule})`
        );
      }
      await message.channel.send({ embed: emb });
    }
  } else {
    let msg = `There is no napchart available for **${member.displayName}**`;
    console.log('MSG   : ', msg);
    if (!dry) {
      await message.channel.send(msg);
    }
  }
}

async function get(message, args, dry) {
  const memberIdentifier = message.content
    .slice(config.prefix.length + 3, message.content.length)
    .trim();
  console.log('INFO:  memberIdentifier: ', memberIdentifier);
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
    if (!member.found) {
      console.log(member.msg);
      if (!dry) {
        await message.channel.send(member.msg);
      }
    } else {
      console.log(
        `INFO:  user found ${member.value.user.tag} -> ${member.value.id}`
      );
    }
  }
  if (member.found) {
    const userDB = await UserModel.findOne({ id: member.value.user.id });
    await sendNapchart(message, userDB, member.value, dry);
  }
}

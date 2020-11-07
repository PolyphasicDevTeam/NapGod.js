const { URL } = require('url');
const _ = require('lodash');
const UserModel = require('./../models/user.model');
const { getOrGenImg, makeNapChartImageUrl } = require('./../imageCache');
const config = require('../../config.json');
const { findMember } = require('./find');
const { executeFunction, dateToStringSimple } = require('./utility');

module.exports = {
  processGet: function (command, message, args, dry = false) {
    if (command === 'status') {
      console.log('STATUS', args);
      executeFunction(get, message, args, dry);
      return true;
    }
    return false;
  },
};

function pad(number) {
  if (number<=99) { number = ("0"+number).slice(-2); }
  return number;
}
async function get(message, args, dry) {
  const memberIdentifier = message.content
    .slice(config.prefix.length + 6, message.content.length)
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
    tzmin = userDB.timezone;
    sign = Math.sign(tzmin);
    if (sign<0){
      sign = "-";
    }
    else{
      sign = "+";
    }
    tzmin = Math.abs(tzmin);
    date = new Date(new Date().getTime() + tzmin * 60000)
    message.channel.send("Time for "  +
      member.value.displayName + " is `"+ dateToStringSimple(date) + "`");
  }
}

const { URL } = require("url");
const LogModel = require("./../models/log.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const schedules = require("./schedules").schedules;

const getLogs = 'getlogs';

module.exports = {
  processGet: function(command, message, args, dry=false) {
    if (command === getLogs) {
      get(args, message, dry);
      return true;
    }
    return false;
  }
};

async function get(args, message, dry) {
  let msg = "";
  let arg = message.content.slice(config.prefix.length + getLogs.length, message.content.length).trim();
  console.log("CMD   : GET");
  console.log("ARGS  : ", arg);
  var uid = arg.replace(/[<@!>]/g, '');
  if (args.length >= 1) {
    if (arg === 'everythingthereisandwas') {
      sendLog(message.channel, null, "everyone", dry);
      return;
    }
    if (Object.keys(schedules).includes(arg.toLowerCase())) {
      sendLog(message.channel, {schedule: arg}, arg, dry);
      return;
    }
    if (uid != '') {//Try to get user by id
      let user = null;
      try {
        user = await message.guild.fetchMember(uid);
      } catch (err) {
        console.warn("WARN  : ", "User could not be fetched by UID", uid);
      }
      if (user != null) { //We found a valid user
        sendLog(message.channel, {userName: user.user.username},
          user.user.nickname ? user.user.nickname : user.user.username, dry);
        return;
      }
    }

    let res = await message.guild.fetchMembers();
    let ms = res.members;
    ms = ms.array();

    let nicks = [];
    let unames = [];
    let tags = [];
    for(var i = 0; i < ms.length; i++) {
      let m = ms[i];
      let nickname = m.nickname;
      if(nickname!=null){
        let ptag_start = nickname.lastIndexOf(' [');
        if (ptag_start != -1) {
          nickname = nickname.slice(0,ptag_start);
        }
      }
      if (nickname == arg) { nicks.push(m); }
      if (m.user.username == arg) { unames.push(m); }
      if (m.user.tag == arg) { tags.push(m); }
    }

    let username = null;
    let displayname = null;
    let msg = null;
    if (nicks.length > 0) { //We have some nicks that match
      if (nicks.length == 1) {
        username = nicks[0].user.username;
        displayname = nicks[0].nickname ? nicks[0].nickname : username;
      }
      else {
        msg = `Multiple users with nickname **${arg}** have been found: `;
        nicks.forEach(nick => {msg = msg + nick.user.tag + " "});
        if (!dry) { message.channel.send(msg); }
      }
    }
    else if (unames.length > 0) { //We have some user names that match
      if (unames.length == 1) {
        username = unames[0].user.username;
        displayname = unames[0].nickname ? unames[0].nickname : username;
      }
      else {
        msg = `Multiple users with username **${arg}** have been found: `;
        unames.forEach(uname => {msg = msg + uname.user.tag + " "});
        if (!dry) { message.channel.send(msg); }
      }
    }
    else if(tags.length > 0) { //We have some user tags that match
      username = tags[0].user.username;
      displayname = tags[0].nickname ? tags[0].nickname : username;
    }
    else {
      msg = `User with nickname, username or tag '**${arg}**' was not found in the discord.`;
      if (!dry) { message.channel.send(msg); }
    }
    if (username != null) {
      sendLog(message.channel, {userName: username}, displayname, dry);
      return;
    }
  }
  else if (args.length === 0) {
    sendLog(message.channel, {userName: message.author.username},
      message.member.displayname ? message.member.displayname : message.author.username, dry);
  }
}

function sendLog(channel, filter, displayname, dry) {
  LogModel.find(filter, (err, res) => {
    if (err) {
      console.warn("WARN  : ", "Could not get log: ", err);
    }
    else {
      let msg = `Logs for **${displayname}**:\n`;
      if (res) {
        res.forEach(log => {
          let d = new Date(log.loggedAt);
          var n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');

          msg += `Logged on ${n}): \n`;
          msg += "```";
          if (!filter || !filter.userName) { msg += `Username: ${log.userName}\n`; }
          msg += `Schedule: ${log.schedule}\n`;
          if (log.attempt) { msg += `Attempt: ${log.attempt}\n`; }
          msg += `Day: ${log.day}\n`;
          if (log.daySegments) { msg += `Segments: ${log.daySegments}\n`; }
          msg += `Moods: ${log.moods}\n`;
          msg += `Awake difficulty: ${log.awakeDifficulty}\n`;
          msg += `Sleep time: ${log.sleepTime}\n`;
          if (log.oversleepTime) { msg += `Oversleep time: ${log.oversleepTime}\n`; }
          if (log.napsNumber) { msg += `Naps number: ${log.napsNumber}\n`; }
          if (log.logMessage) { msg += `LogMessage: ${log.logMessage}\n`; }
          if (log.attachment) { msg += `Attachment: ${log.attachment}\n`; }
          msg += "```";
        });
        if (!dry){
          channel.send(msg);
        }
      }
      else {
        msg = `There is no log available for **${displayname}**`;
        if (!dry) { channel.send(msg); }
      }
    }
  });
}

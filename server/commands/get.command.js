const { URL } = require('url');
const _ = require('lodash');
const UserModel = require('./../models/user.model');
const { getOrGenImg, makeNapChartImageUrl } = require('./../imageCache');
const config = require('../../config.json');

module.exports = {
  processGet: function (command, message, args, dry = false) {
    if (command === 'get') {
      //if (args.length <= 1) {
      get(args, message, dry);
      //} else {
      //What?
      //msg = "Valid options are `+get` or `+get userName` or `+get usertag#1234`"
      //console.log("MSG   : ", msg)
      //if(!dry){message.channel.send(msg);}
      //}
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
  if (res > 1) {
    resUnit += 's';
  }
  return `${res} ${resUnit}`;
}

async function sendNapchart(message, res, displayName, dry) {
  let msg;
  if (res && res.currentScheduleChart) {
    console.log(res.updatedAt);
    let d = new Date(res.updatedAt);
    let n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let delta = diffTimeCut(d);
    msg = `Napchart for **${displayName}** (since ${n}) (${delta}):`;
    console.log('MSG   : ', msg);
    if (!dry) {
      let emb = await getOrGenImg(res.currentScheduleChart, message, dry);
      message.channel.send(msg, { embed: emb });
    }
  } else {
    msg = `There is no napchart available for **${displayName}**`;
    console.log('MSG   : ', msg);
    if (!dry) {
      message.channel.send(msg);
    }
  }
}

async function get(args, message, dry) {
  let msg = '';
  arg = message.content
    .slice(config.prefix.length + 3, message.content.length)
    .trim();
  console.log('CMD   : GET');
  console.log('ARGS  : ', arg);
  var uid = arg.replace(/[<@!>]/g, '');
  if (args.length >= 1) {
    if (uid != '') {
      //Try to get user by id
      let user = null;
      try {
        user = await message.guild.fetchMember(uid);
      } catch (err) {
        console.warn('WARN  : ', 'User could not be fetched by UID', uid);
      }
      if (user != null) {
        //We found a valid user
        let res;
        try {
          res = await UserModel.findOne({ id: user.user.id });
        } catch (err) {
          console.warn('WARN  : ', 'Could not get user: ', err);
        }

        displayName = user.nickname;
        if (!displayName) {
          displayName = user.user.username;
        }
        sendNapchart(message, res, displayName, dry);
        return;
      }
    }

    res = await message.guild.fetchMembers();
    ms = res.members;
    ms = ms.array();
    console.log('INFO  : ', 'nmembers', ms.length);

    nicks = [];
    unames = [];
    tags = [];
    for (var i = 0; i < ms.length; i++) {
      m = ms[i];
      nickname = m.nickname;
      if (nickname != null) {
        ptag_start = nickname.lastIndexOf(' [');
        if (ptag_start != -1) {
          nickname = nickname.slice(0, ptag_start);
        }
      }
      if (nickname == arg) {
        nicks.push(m);
      }
      if (m.user.username == arg) {
        unames.push(m);
      }
      if (m.user.tag == arg) {
        tags.push(m);
      }
    }

    usr = null;
    uid = null;
    if (nicks.length > 0) {
      //We have some nicks that match
      if (nicks.length == 1) {
        uid = nicks[0].user.id;
        usr = nicks[0].nickname;
        if (!usr) {
          usr = nicks[0].user.username;
        }
      } else {
        msg = `Multiple users with nickname **${arg}** have been found: `;
        nicks.forEach((nick) => {
          msg = msg + nick.user.tag + ' ';
        });
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      }
    } else if (unames.length > 0) {
      //We have some user names that match
      if (unames.length == 1) {
        uid = unames[0].user.id;
        usr = unames[0].nickname;
        if (!usr) {
          usr = unames[0].user.username;
        }
      } else {
        msg = `Multiple users with username **${arg}** have been found: `;
        unames.forEach((uname) => {
          msg = msg + uname.user.tag + ' ';
        });
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      }
    } else if (tags.length > 0) {
      //We have some user tags that match
      uid = tags[0].user.id;
      usr = tags[0].nickname;
      if (!usr) {
        usr = tags[0].user.username;
      }
    } else {
      msg = `User with nickname, username or tag '**${arg}**' was not found in the discord.`;
      console.log('MSG   : ', msg);
      if (!dry) {
        message.channel.send(msg);
      }
    }
    if (uid != null) {
      try {
        res = await UserModel.findOne({ id: uid });
      } catch (err) {
        console.warn('WARN  : ', 'Could not get user: ', err);
        msg = `There is no napchart available for **${arg}**`;
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
        return;
      }
      sendNapchart(message, res, usr, dry);
    }
  } else if (args.length === 0) {
    let res;
    try {
      res = await UserModel.findOne({ id: message.author.id });
    } catch (err) {
      console.warn('WARN  : ', 'Could not get user: ', err);
    }

    displayName = message.member.nickname;
    if (!displayName) {
      displayName = message.author.username;
    }
    sendNapchart(message, res, displayName, dry);
  }
}

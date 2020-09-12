const config = require('../../config.json');
const FocusModel = require('./../models/focus.model');
const { findMember } = require('./find');
const { cutAt, executeFunction, h_n_m } = require('./utility');

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

module.exports = {
  procesFocus: function (command, message, args, dry = false) {
    if (command === 'unfocus') {
      console.log('CMD   : UNFOCUS');
      console.log('ARGS  : ', args);
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
      );
      if (args.length >= 1) {
        // one argument = mod only command, for unfocusing someone
        if (permissions) {
          executeFunction(unfocus_admin, message, args, dry);
        } else {
          let msg =
            'You do not have the privileges to execute this command. Only Moderator or Admins are allowed to unfocus someone';
          console.log('MSG  :', msg);
          if (!dry) {
            message.channel.send(msg);
          }
        }
      } else if (args.length == 0) {
        executeFunction(self_unfocus, message, args, dry);
      } else {
        let msg = 'Valid options are `+unfocus`';
        if (permissions) {
          msg += ' or `+unfocus [username]`';
        }
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      }
      return true;
    }
    return false;
  },
};

function expire_time(user) {
  let result = FocusModel.findOne({ id: user.id });
  return result;
}

function formatDate(date) {
  return '{date} {0} {1} {3} {4}:{5}:{6} UTC'
    .replace('{date}', days[date.getDay()])
    .replace('{0}', date.getDate())
    .replace('{1}', months[date.getMonth()])
    .replace('{3}', date.getFullYear())
    .replace('{4}', date.getHours())
    .replace(
      '{5}',
      date.getMinutes().toString().length == 1
        ? '0' + date.getMinutes()
        : date.getMinutes()
    )
    .replace(
      '{6}',
      date.getSeconds().toString().length == 1
        ? '0' + date.getSeconds()
        : date.getSeconds()
    );
}

function setPermissionUnfocus(message, member) {
  message.guild.channels.forEach((chan) => {
    if (chan.name !== 'focus' && chan.manageable) {
      chan.overwritePermissions(member, { VIEW_CHANNEL: null });
    }
  });
}

async function self_unfocus(message, args, dry) {
  let msg = '';
  let member = message.member;
  let time = await expire_time(member);
  if (time == null) {
    msg = "You're not focus in the first place!";
    console.log('MSG: ', msg);
    if (!dry) {
      message.channel.send(msg);
    }
  } else if (time.endDate > new Date()) {
    msg =
      "You can't be unfocused yet! Focus end on " +
      formatDate(time.endDate) +
      ' (' +
      h_n_m((time.endDate - new Date()) / 60000) +
      ')';
    console.log('MSG: ', msg);
    if (!dry) {
      message.channel.send(msg);
    }
  } else {
    unfocus(member, message, dry);
  }
}

async function unfocus_admin(message, args, dry) {
  const memberIdentifier = message.content.replace(
    config.prefix + 'unfocus',
    ''
  );
  let member = findMember(
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
    member = member.value;
    unfocus(member, message, dry);
  }
}

function unsetRole(user, name_role, message, dry) {
  let role = message.guild.roles.find((d) => d.name === name_role.trim());
  let roles = user.roles;
  roles = new Set(roles.keys());
  roles.delete(role.id);
  if (!dry) {
    user.setRoles(Array.from(roles));
  }
}

async function deleteReturnLast(chan, option, prevMsg, cond) {
  return chan
    .fetchMessages(option)
    .then(async (msgs) => {
      if (msgs.size === 0) {
        if (cond(prevMsg)) {
          prevMsg
            .delete()
            .then((d) => console.log('last message deleted: ' + d.content))
            .catch((err) =>
              console.log('ERR>>', err, prevMsg.content, option.before)
            );
        }
        return prevMsg;
      }
      let last = msgs.last();
      for (const [id, msg] of msgs) {
        let tmp = id === last.id ? prevMsg : msg;
        if (cond(tmp)) {
          tmp
            .delete()
            .then((d) => console.log('Message deleted: ' + tmp.content))
            .catch((err) => console.log('ERR>>', err));
        }
      }
      return last;
    })
    .catch((err) => console.log('ERR>>', err));
}

function cond(msg, author) {
  return msg.member === author || msg.member === msg.guild.me;
}

async function deleteMessages(user, message) {
  const chan = message.guild.channels.find((d) => d.name === 'focus');
  let last = chan.lastMessage;
  while (
    last !==
    (last = await deleteReturnLast(
      chan,
      { limit: 50, before: last.id },
      last,
      (msg) => cond(msg, user)
    ))
  ) {}
  if (cond(last, user)) {
    last.delete();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function unfocus(user, message, dry) {
  let query = { id: user.id };
  try {
    let result = await FocusModel.findOneAndRemove(query);
    if (result != null) {
      await unsetRole(user, 'Focus', message, dry);
      await setPermissionUnfocus(message, user);
      let msg = user.user.tag + " isn't focus anymore!";
      console.log('MSG: ', msg);
      if (!dry) {
        message.channel.send(msg).then(async (msg) => {
          await sleep(5000);
          msg.delete();
        });
      }
      if (!dry && message.channel.name != 'botspam') {
        message.client.channels.find((d) => d.name === 'botspam').send(msg);
      }
      await deleteMessages(user, message);
    } else {
      let msg = user.user.tag + " isn't focus in the first place!";
      console.log('MSG: ', msg);
      if (!dry) {
        message.channel.send(msg);
      }
    }
  } catch (error) {
    console.log('error updating in unfocus', error);
    if (!dry) {
      message.channel.send('We have a problem here. Contact the admin team. ');
    }
  }
}

const _ = require('lodash');
const UserModel = require('./../models/user.model');
const config = require('../../config.json');

module.exports = {
  processToggle: function (args, message, dry) {
    toggle(args, message, dry);
  },
};

async function toggle(args, message, dry) {
  let msg = '';
  //We need to extract the username which can containe arbitrary whitespaces
  //First get rid of the prefix and 'tg' command string (3chars long) and trim
  message.content = message.content
    .slice(config.prefix.length + 3, message.content.length)
    .trim();
  let split_msg = message.content.split(',');
  let user = split_msg.pop();
  user = user.trim();
  //Lets see if we can get user id from mention string
  let uid = user.replace(/[<@!>]/g, '');
  if (uid != '') {
    //Try to get user by id
    console.log('INFO  : ', 'User mentioned by UID', uid);
    let member = null;
    try {
      member = await message.guild.fetchMember(uid);
    } catch (err) {
      console.warn('WARN  : ', 'User could not be fetched by UID', uid);
    }
    if (member != null) {
      //We found a valid user
      console.log('INFO  : ', 'User was found by UID', member.user.tag);
      toggle_list(member, split_msg, dry, message);
      return;
    }
  }

  //res = await message.guild.fetchMembers(user)
  let res = await message.guild.fetchMembers();
  let ms = res.members;
  ms = ms.array();

  let nicks = [];
  let unames = [];
  let tags = [];
  for (let i = 0; i < ms.length; i++) {
    let m = ms[i];
    let nickname = m.nickname;
    if (nickname != null) {
      let ptag_start = nickname.lastIndexOf(' [');
      if (ptag_start != -1) {
        nickname = nickname.slice(0, ptag_start);
      }
    }
    if (nickname == user) {
      nicks.push(m);
    }
    if (m.user.username == user) {
      unames.push(m);
    }
    if (m.user.tag == user) {
      tags.push(m);
    }
  }

  let usr = null;
  if (nicks.length > 0) {
    //We have some nicks that match
    if (nicks.length == 1) {
      usr = nicks[0];
    } else {
      msg = `Multiple users with nickname **${user}** have been found: `;
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
      usr = unames[0];
    } else {
      msg = `Multiple users with username **${user}** have been found: `;
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
    usr = tags[0];
  } else {
    msg = `User with nickname, username or tag '**${user}**' was not found in the discord.`;
    console.log('MSG   : ', msg);
    if (!dry) {
      message.channel.send(msg);
    }
  }
  if (usr != null) {
    console.log('INFO  : ', 'User was found by UID', usr.user.tag);
    toggle_list(usr, split_msg, dry, message);
    return;
  }
}

function toggle_role(user, roles, name_role, message, dry) {
  let role = message.guild.roles.find('name', name_role.trim());
  if (role != null) {
    if (roles.has(role.id)) {
      roles.delete(role.id);
      return user.user.tag + ' has lost the role ' + name_role + '\n';
    } else {
      roles.add(role.id);
      return user.user.tag + ' has now the role ' + name_role + '\n';
    }
  } else {
    return 'The role ' + name_role + " doesn't exist\n";
  }
}

function toggle_list(user, role_array, dry, message) {
  let msg = '';
  let roles = user.roles;
  roles = new Set(roles.keys());
  // TODO transform it to a reduce
  role_array.forEach(function (d) {
    msg += toggle_role(user, roles, d, message, dry);
  });
  if (!dry) {
    user.setRoles(Array.from(roles));
  }
  if (!dry) {
    message.channel.send(msg);
  }
}

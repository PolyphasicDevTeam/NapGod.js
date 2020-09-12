const config = require('../../config.json');
const { findMember, findRole } = require('./find');
const { cutAt, executeFunction } = require('./utility');

module.exports = {
  processToggle: function (command, message, args, dry = false) {
    if (command === 'tg') {
      args = message.content
        .replace(config.prefix + 'tg', '')
        .trim()
        .split(',');
      console.log('CMD   : TOGGLE');
      console.log('ARGS  : ', args);
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderators'].includes(d.name)
      );
      if (!permissions) {
        let msg =
          'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+tg`';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else if (args.length >= 2) {
        executeFunction(toggle, message, args, dry);
      } else {
        let msg = 'Valid options are `+tg [role] [username]`';
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

async function toggle(msg, args, dry) {
  const memberIdentifier = args.pop();
  let roles = [];
  let i = 0;
  let tmpRole;
  while (
    i < args.length && // args[roles.length]
    (tmpRole = findRole(args[i], msg.guild, msg.mentions.roles)).found
  ) {
    roles.push(tmpRole.value);
    i++;
  }
  if (roles.length === args.length) {
    roles = new Set(roles);
    if (roles.has(msg.guild.defaultRole)) {
      roles.delete(msg.guild.defaultRole);
      await msg.channel.send('`@everyone` role is not manageable');
    }
    let member = findMember(memberIdentifier, msg.guild, msg.mentions.users);
    if (member.found) {
      member = member.value;
      const higherRole = msg.guild.me.roles
        .sort((a, b) => a.position - b.position)
        .last();
      let rolesToRemove = member.roles.filter(
        (d) => roles.has(d) && d.position < higherRole.position
      );
      roles = Array.from(roles);
      const rolesToAdd = roles.filter(
        (d) => !rolesToRemove.has(d.id) && d.position < higherRole.position
      );
      const rolesTooHigh = roles.filter(
        (d) => d.position >= higherRole.position
      );
      rolesToRemove = rolesToRemove.array();
      if (!dry) {
        await member.addRoles(rolesToAdd);
        await member.removeRoles(rolesToRemove);
        await sendInfoRole(
          rolesToRemove,
          `${member.displayName} has lost the role`,
          msg.channel
        );
        await sendInfoRole(
          rolesToAdd,
          `${member.displayName} has now the role`,
          msg.channel
        );
        await sendInfoRole(
          rolesTooHigh,
          "I can't manage the following role",
          msg.channel
        );
      }
    } else {
      console.log(member.msg);
      if (!dry) {
        await msg.channel.send(member.msg);
      }
    }
  } else {
    console.log(tmpRole.msg);
    if (!dry) {
      await msg.channel.send(tmpRole.msg);
    }
  }
}

async function sendInfoRole(roles, string, channel) {
  if (roles.length > 0) {
    let s = '';
    if (roles.length > 1) {
      s = 's';
    }
    await channel.send(
      `${string}${s} : ${cutAt(
        roles.map((r) => `\`${r.name}\``).join(', '),
        500,
        ','
      )}`
    );
  }
}

const config = require('../../config.json');
const { findMember, findRole } = require('./find');
const { cutAt } = require('./utility');

module.exports = {
  processToggle: function (command, message, args, dry = false) {
    if (command === 'tg') {
      args = message.content.replace('+tg', '').trim().split(',');
      console.log('CMD   : TOGGLE');
      console.log('ARGS  : ', args);
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderators'].includes(d.name)
      );
      let msg = '';
      if (!permissions) {
        msg =
          'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+tg`';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else if (args.length >= 2) {
        toggle(args, message, dry);
      } else {
        msg = 'Valid options are `+tg [role] [username]`';
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

async function toggle(args, message, dry) {
  const memberIdentifier = args.pop();
  try {
    let roles = new Set(
      args.map((d) => findRole(d, message.guild, message.mentions.roles))
    );
    const member = findMember(
      memberIdentifier,
      message.guild,
      message.mentions.users
    );
    const higherRole = message.guild.me.roles
      .sort((a, b) => a.position - b.position)
      .last();
    console.log(higherRole.position);
    console.log(message.guild.roles.get('417050245885853706').position);
    // [0] -> to Remove | [1] -> to Add
    let rolesToRemove = member.roles.filter(
      (d) => roles.has(d) && d.position < higherRole.position
    );
    roles = Array.from(roles);
    const rolesToAdd = roles.filter(
      (d) => !rolesToRemove.has(d.id) && d.position < higherRole.position
    );
    const rolesTooHigh = roles.filter((d) => d.position >= higherRole.position);
    rolesToRemove = rolesToRemove.array();
    if (!dry) {
      await member.addRoles(rolesToAdd);
      await member.removeRoles(rolesToRemove);
      sendInfoRole(
        rolesToRemove,
        `${member.displayName} has lost the role`,
        message.channel
      );
      sendInfoRole(
        rolesToAdd,
        `${member.displayName} has now the role`,
        message.channel
      );
      sendInfoRole(
        rolesTooHigh,
        "I can't manage the following role",
        message.channel
      );
    }
  } catch (e) {
    console.log(e);
    if (!dry) {
      message.channel.send(e.toString());
    }
  }
}

function sendInfoRole(roles, string, channel) {
  if (roles.length > 0) {
    let s = '';
    if (roles.length > 1) {
      s = 's';
    }
    channel.send(
      `${string}${s} : ${cutAt(
        roles.map((r) => `\`${r.name}\``).join(', '),
        500,
        ','
      )}`
    );
  }
}

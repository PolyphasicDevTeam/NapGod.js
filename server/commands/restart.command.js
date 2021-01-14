'use strict';

module.exports = {
  processReboot: function (command, message, args, dry = false) {
    if (command === 'restart') {
      console.log('CMD   : RESTART');
      console.log('ARGS  : ', args);
      let roles = message.member.roles;
      roles = new Set(roles.keys());
      let mods = message.guild.roles.find('name', 'Moderator').id;
      let admins = message.guild.roles.find('name', 'Admins').id;
      let permissions = false;
      if (roles.has(mods) || roles.has(admins)) {
        permissions = true;
      }
      if (!permissions) {
        let msg =
          'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+restart`';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else {
        restart(message.channel, dry);
      }
      return true;
    }
    return false;
  },
};

async function restart(channel, dry) {
  console.log('INFO  : Restarting');
  if (!dry) {
    await channel.send('Restarting....');
  }
  process.exit();
}

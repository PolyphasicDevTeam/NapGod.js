const config = require('../../config.json');
const _ = require('lodash');

module.exports = {
  processSay: function (command, message, args, dry = false) {
    if (command === 'say') {
      console.log('CMD   : SAY');
      console.log('ARGS  : ', args);
      let roles = message.member.roles;
      roles = new Set(roles.keys());
      let mods = message.guild.roles.find('name', 'Moderator').id;
      let admins = message.guild.roles.find('name', 'Admins').id;
      permissions = false;
      if (roles.has(mods) || roles.has(admins)) {
        permissions = true;
      }
      if (!permissions) {
        let msg =
          'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+say`';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else {
        if (!dry) {
          const split_msg = message.content
            .replace(/\+say\s*/, '') // hardcoded, later not
            .split(/(?<=^\S+)\s/);
          const channelID = split_msg[0].replace(/[^0-9]/g, '');
          const channel = message.client.channels.get(channelID);
          if (channel === undefined) {
            message.channel.send('Invalid channel');
            console.log('ERROR : Invalid channel ');
          } else {
            console.log('ACT   : ', 'Deleting user input message');
            message.delete().catch((O_o) => {});
            console.log('MSG   : ', 'Repriting user input');
            channel.send(split_msg[1].trim());
          }
        }
      }
      return true;
    }
    return false;
  },
};

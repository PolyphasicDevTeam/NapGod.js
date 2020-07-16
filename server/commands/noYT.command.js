'use strict';

const config = require('../../config.json');

module.exports = {
  processToggleEvents: function (command, message, args, dry = false) {
    if (command === 'noyt') {
      console.log('CMD   : NOYT');
      console.log('ARGS  : ', args);
      let msg = '';
      let roles = message.member.roles;
      roles = new Set(roles.keys());
      let noYTRole = message.guild.roles.find('name', 'No YT plz').id;
      if (roles.has(noYTRole)) {
        roles.delete(noYTRole);
        msg = message.author.tag + ' no longer has the No YT plz role.';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else {
        roles.add(noYTRole);
        msg = message.author.tag + ' now has the No YT plz role.';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      }
      if (!dry) {
        message.member.setRoles(Array.from(roles));
      }

      return true;
    }
    return false;
  },
};

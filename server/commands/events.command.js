const config = require('../../config.json');
const _ = require('lodash');

module.exports = {
  processToggleEvents: function (command, message, args, dry = false) {
    if (command === 'toggleevents') {
      console.log('CMD   : TOGGLEEVENTS');
      console.log('ARGS  : ', args);

      let roles = message.member.roles;
      roles = new Set(roles.keys());
      eventsRole = message.guild.roles.find('name', 'Events').id;
      if (roles.has(eventsRole)) {
        roles.delete(eventsRole);
        msg = message.author.tag + ' no longer has the Events role.';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else {
        roles.add(eventsRole);
        msg = message.author.tag + ' now has the Events role.';
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

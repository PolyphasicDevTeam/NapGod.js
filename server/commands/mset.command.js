const { URL } = require('url');
const _ = require('lodash');
const UserModel = require('./../models/user.model');
const { getOrGenImg, makeNapchartImageUrl } = require('./../imageCache');
const config = require('../../config.json');
const mset = require('./mset.backend').msetInternal;

module.exports = {
  processMset: function (command, message, args, dry = false) {
    if (command === 'mset') {
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
      );
      if (!permissions) {
        const msg =
          'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+mset`';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else if (args.length >= 3) {
        mset(args, message, dry);
      } else {
        const msg =
          'Valid options are `+mset [schedule-name] [napchart-link] [username]`';
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

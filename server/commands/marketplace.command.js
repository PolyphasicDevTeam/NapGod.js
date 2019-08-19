'use strict';

module.exports = {
  processToggleMarketplace: function(command, message, args, dry = false) {
    if (command === 'togglemarketplace') {
      console.log('CMD   : TOGGLEMARKETPLACE');
      console.log('ARGS  : ', args);

      const roles = new Set(message.member.roles.keys());
      const marketplaceRole = message.guild.roles.find('name', 'Marketplace').id;
      if (roles.has(marketplaceRole)) {
        roles.delete(marketplaceRole);
        const msg = message.author.tag + ' no longer has the Marketplace role.';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else {
        roles.add(marketplaceRole);
        const msg = message.author.tag + ' has now the Marketplace role.';
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

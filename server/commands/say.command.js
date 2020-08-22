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
      let permissions = false;
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
          say(message, args);
        }
      }
      return true;
    }
    return false;
  },
};

async function say(message, args) {
  const split_msg = message.content
    .replace(/\+say\s*/, '')
    .trim() // hardcoded, later not
    .split(/(?<=^\S+)\s/);
  const channelID = split_msg[0].replace(/[^0-9]/g, '');
  let channel = message.client.channels.get(channelID);
  let content = split_msg[1] || '';
  if (channel === undefined) {
    channel = message.channel;
    content = split_msg.join(' ');
  }
  const files = message.attachments.map((v) => v.proxyURL);
  if (content === '' && files.length === 0) {
    const msg = 'No content nor files';
    await message.channel.send(msg);
    console.log(`ERROR : ${msg}`);
    g;
  } else {
    console.log('MSG   : ', 'Repriting user input');
    await channel.send(content, { files: files });
    console.log('ACT   : ', 'Deleting user input message');
    await message.delete().catch((O_o) => {});
  }
}

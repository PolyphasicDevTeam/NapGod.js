const { RichEmbed, Permissions } = require('discord.js');
const config = require('../../config.json');
const { findRole } = require('./find');
const { cutAt } = require('./utility');

function processRoleInfo(command, message, args, dry = false) {
  const commandName = 'roleinfo';
  if (command === commandName) {
    const roleIdentifier = message.content
      .replace(config.prefix + commandName, '')
      .trim();
    if (roleIdentifier === '') {
      let msg =
        'You need to provide at least one argument to retrieve the role.';
      console.log('INFO:  ', msg);
      if (!dry) {
        message.channel.send(msg);
      }
    } else {
      roleInfo(message, roleIdentifier, dry);
    }
    return true;
  }
  return false;
}

function buildEmbedRole(role) {
  let embed = new RichEmbed();
  embed.setTitle(role.name);
  embed.setColor(role.color);
  embed.setFooter(`ID: ${role.id}`);
  embed.setTimestamp();
  embed.setDescription(role);

  embed.addField('Mentionable', role.mentionable, true);
  embed.addField('Managed', role.managed, true);
  embed.addField('Hoist', role.hoist, true);
  embed.addField('Position', role.position, true);
  embed.addField('Creation Date', role.createdAt.toDateString(), true);
  embed.addField('Members Count', role.members.size, true);
  const permsEveryone = new Permissions(role.guild.defaultRole.permissions);
  const perms = new Permissions(role.permissions)
    .toArray()
    .filter((p) => !permsEveryone.has(p));
  if (perms.length > 0) {
    embed.addField('Permissions', perms.join(', '));
  }
  return embed;
}

function roleInfo(message, roleIdentifier, dry) {
  try {
    console.log('INFO:  roleIdentifier: ', roleIdentifier);
    let role = findRole(roleIdentifier, message.guild, message.mentions.roles);
    console.log(`INFO:  role found ${role.name} -> ${role.id}`);
    if (!dry) {
      const embed = buildEmbedRole(role);
      message.channel.send(embed);
    }
  } catch (e) {
    console.log(e);
    message.channel.send(e.toString());
  }
}

module.exports = {
  processRoleInfo,
};

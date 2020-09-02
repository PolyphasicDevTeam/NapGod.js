const { RichEmbed, Permissions } = require('discord.js');
const config = require('../../config.json');
const { findRole } = require('./find');
const { cutAt, executeFunction } = require('./utility');

const commandName = 'roleinfo';
function processRoleInfo(command, message, args, dry = false) {
  if (command === commandName) {
    if (args.length === 0) {
      let msg =
        'You need to provide at least one argument to retrieve the role.';
      console.log('INFO:  ', msg);
      if (!dry) {
        message.channel.send(msg);
      }
    } else {
      executeFunction(roleInfo, message, args, dry);
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

async function roleInfo(message, args, dry) {
  const roleIdentifier = message.content
    .replace(config.prefix + commandName, '')
    .trim();
  console.log('INFO:  roleIdentifier: ', roleIdentifier);
  let role = await findRole(
    roleIdentifier,
    message.guild,
    message.mentions.roles
  );
  if (!role.found) {
    console.log(role.msg);
    if (!dry) {
      await message.channel.send(role.msg);
    }
  } else {
    role = role.value;
    console.log(`INFO:  role found ${role.name} -> ${role.id}`);
    if (!dry) {
      const embed = buildEmbedRole(role);
      await message.channel.send(embed);
    }
  }
}

module.exports = {
  processRoleInfo,
};

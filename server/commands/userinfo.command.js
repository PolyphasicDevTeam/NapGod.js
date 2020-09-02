const { RichEmbed, Permissions } = require('discord.js');
const config = require('../../config.json');
const { findMember } = require('./find');
const { cutAt, executeFunction } = require('./utility');

const commandName = 'userinfo';
function processUserInfo(command, message, args, dry = false) {
  if (command === commandName) {
    executeFunction(userInfo, message, args, dry);
    return true;
  }
  return false;
}

function getStatusPresence(status) {
  const liste = {
    online: '🟢 online',
    dnd: '🔴 dnd',
    offline: '⚫ offline',
    idle: '🟡 idle',
  };
  return liste[status];
}

function buildEmbedMember(member) {
  let embed = new RichEmbed();
  embed.setAuthor(member.user.tag, member.user.avatarURL);
  embed.setColor(member.displayColor);
  embed.setFooter(`ID: ${member.id}`);
  embed.setTimestamp();
  embed.setDescription(member);
  embed.setThumbnail(member.user.avatarURL);
  embed.addField('Join Date', member.joinedAt.toUTCString(), true);
  embed.addField('Register Date', member.user.createdAt.toUTCString(), true);
  if (member.user.bot) {
    embed.addField('Bot', true, true);
  }
  if (member.premiumSince !== null) {
    embed.addField('Premium Date', member.premiumSince, true);
  }
  embed.addField(
    'Joined Position',
    member.guild.members
      .sort(
        (memberA, memberB) => memberA.joinedTimestamp - memberB.joinedTimestamp
      )
      .keyArray()
      .indexOf(member.id) + 1,
    true
  );
  embed.addField('Presence', getStatusPresence(member.presence.status), true);
  // missing not working
  const permsEveryone = new Permissions(member.guild.defaultRole.permissions);
  const perms = member.permissions
    .toArray()
    .filter((p) => !permsEveryone.has(p));
  if (perms.length > 0) {
    embed.addField('Permissions', perms.join(', '));
  }
  let roles = member.roles.array().join(' ').replace('@everyone', '');
  roles = cutAt(roles, 1000, '<');
  if (roles.length > 0) {
    embed.addField(`Roles [${member.roles.size - 1}]`, roles);
  }
  return embed;
}

async function userInfo(message, args, dry) {
  const memberIdentifier = message.content
    .replace(config.prefix + commandName, '')
    .trim();
  console.log('INFO:  memberIdentifier: ', memberIdentifier);
  let member;
  if (memberIdentifier === '') {
    member = message.member;
  } else {
    member = findMember(
      memberIdentifier,
      message.guild,
      message.mentions.users
    );
    if (!member.found) {
      console.log(member.msg);
      if (!dry) {
        await message.channel.send(member.msg);
      }
      return;
    } else {
      member = member.value;
    }
  }
  console.log(`INFO:  user found ${member.user.tag} -> ${member.id}`);
  if (!dry) {
    const embed = buildEmbedMember(member);
    await message.channel.send(embed);
  }
}

module.exports = {
  processUserInfo,
};

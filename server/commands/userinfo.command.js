const { RichEmbed, Permissions } = require('discord.js');
const config = require('../../config.json');
const { findMember } = require('./find');
const { cutAt } = require('./utility');

function processUserInfo(command, message, args, dry = false) {
  const commandName = 'userinfo';
  if (command === commandName) {
    const memberIdentifier = message.content
      .replace(config.prefix + commandName, '')
      .trim();
    userInfo(message, memberIdentifier, dry);
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
  embed.addField('Join Date', member.joinedAt.toDateString(), true);
  embed.addField('Register Date', member.user.createdAt.toDateString(), true);
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
    embed.addField('Roles', roles);
  }
  return embed;
}

function userInfo(message, memberIdentifier, dry) {
  try {
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
    }
    console.log(`INFO:  user found ${member.user.tag} -> ${member.id}`);
    if (!dry) {
      const embed = buildEmbedMember(member);
      message.channel.send(embed);
    }
  } catch (e) {
    console.log(e);
    message.channel.send(e.toString());
  }
}

module.exports = {
  processUserInfo,
};

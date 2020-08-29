const Discord = require('discord.js');
const { cutAt } = require('./utility');

function find(
  identifier,
  guildFound,
  mentions,
  fncts,
  regexMentions,
  display,
  name,
  format = (x) => x
) {
  let found = mentions.get(identifier.replace(regexMentions, ''));
  if (found === undefined) {
    found = guildFound.get(identifier);
    if (found === undefined) {
      let i = 0;
      let tmpFounds;
      do {
        tmpFounds = guildFound.filter(fncts[i]);
      } while (tmpFounds.size !== 1 && ++i < fncts.length);
      let msg;
      switch (tmpFounds.size) {
        case 0:
          if (identifier.length > 100) {
            identifier = identifier.slice(0, 100) + '...';
          }
          throw `Error: no ${name} found with the identifier ${identifier}`;
          break;
        case 1:
          found = tmpFounds.first();
          break;
        default:
          let listeFoundName = tmpFounds
            .reduce((acc, v) => acc + ', ' + v[display], '')
            .replace(', ', '');
          throw `Error: too much ${name} match the name ${cutAt(
            identifier,
            100
          )}: \`${cutAt(listeFoundName, 200, ',')}\``;
          break;
      }
    }
  }
  return format(found);
}

function findRole(roleIdentifier, guild, mentions = new Discord.Collection()) {
  roleIdentifier = roleIdentifier.trim();
  // https://stackoverflow.com/a/3561711/8040287
  const identifierClearRegex = roleIdentifier
    .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    .replace(/\s/g, '.*');

  const regexClear = new RegExp(identifierClearRegex);
  const regexClearI = new RegExp(identifierClearRegex, 'i');
  let fncts = [
    (r) => r.id !== guild.id && r.name === roleIdentifier,
    (r) =>
      r.id !== guild.id &&
      r.name.toLowerCase() === roleIdentifier.toLowerCase(),
    (r) => r.id !== guild.id && regexClear.test(r.name),
    (r) => r.id !== guild.id && regexClearI.test(r.name),
  ];
  try {
    const identifierRegexRaw = roleIdentifier.replace(/\s/g, '.*');
    let regexRaw = new RegExp(identifierRegexRaw);
    let regexIRaw = new RegExp(identifierRegexRaw, 'i');
    fncts.push((r) => regexRaw.test(r.name));
    fncts.push((r) => regexIRaw.test(r.name));
  } catch (e) {
    console.log('INFO: wrong syntax to create regexp from raw string');
  }

  const display = 'name';
  const regexMentions = /<@&|>/g;
  const name = 'Roles';
  return find(
    roleIdentifier,
    guild.roles,
    mentions,
    fncts,
    regexMentions,
    display,
    name
  );
}

function compareMember(f, member) {
  return f(member.displayName) || f(member.user.tag) || f(member.user.username);
}

function findMember(
  memberIdentifier,
  guild,
  mentions = new Discord.Collection()
) {
  memberIdentifier = memberIdentifier.trim();
  // https://stackoverflow.com/a/3561711/8040287
  const identifierClearRegex = memberIdentifier
    .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    .replace(/\s/g, '.*');
  const regexClear = new RegExp(identifierClearRegex);
  const regexClearI = new RegExp(identifierClearRegex, 'i');
  let fncts = [
    (m) => compareMember((d) => d === memberIdentifier, m),
    (m) =>
      compareMember(
        (d) => d.toLowerCase() === memberIdentifier.toLowerCase(),
        m
      ),
    (m) => compareMember(regexClear.test.bind(regexClear), m),
    (m) => compareMember(regexClearI.test.bind(regexClearI), m),
  ];
  try {
    const identifierRegexRaw = memberIdentifier.replace(/\s/g, '.*');
    let regexRaw = new RegExp(identifierRegexRaw);
    let regexIRaw = new RegExp(identifierRegexRaw, 'i');
    fncts.push((m) => compareMember(regexRaw.test.bind(regexRaw), m));
    fncts.push((m) => compareMember(regexIRaw.test.bind(regexIRaw), m));
  } catch (e) {
    console.log('INFO: wrong syntax to create regexp from raw string');
  }

  const format = guild.member.bind(guild);
  const display = 'displayName';
  const regexMentions = /<@!|>/g;
  const name = 'Users';
  return find(
    memberIdentifier,
    guild.members,
    mentions,
    fncts,
    regexMentions,
    display,
    name,
    format
  );
}

module.exports = {
  findRole,
  findMember,
};

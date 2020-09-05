const Discord = require('discord.js');

module.exports = function() {
  this.timeout = 3600;
  this.timeoutMessage = 'This session has expired. Please restart from the begining.';
  this.abortMessage = 'Aborted.';
  this.qSleepTracker_message = 'You may now post your EEG graph here, or otherwise write `X`.';

  this.getMember = function getMember(message) {
    const guild = getGuild(message);
    const userId = message.author.id;
    return guild.members.find((member) => member.user.id === userId);
  };
  this.getChannel = function getChannel(message, channelName) {
    const guild = getGuild(message);
    return guild.channels.find((channel) => channel.name === channelName);
  };
  this.getGuild = function getGuild(message) {
    return message.client.guilds.first();
  };
  this.hasRole = function hasRole(member, roleName) {
    return member.roles.find((role) => role.name === roleName);
  };

  this.collectFromUser = async function collectFromUser(author, channel, step,
    checkInput = (collected) => '') {
    try {
      while (true) {
        let collected = await channel.awaitMessages(
          (x) => x.author.id === author.id,
          { maxMatches: 1, time: timeout * 1000, errors: ['time'] }
        );
        if (collected.first().content.toLowerCase() === 'abort') {
          author.send(abortMessage);
          return null;
        }
        let wrongInput = checkInput(collected.first());
        if (!wrongInput) {
          return collected.first();
        }
        author.send(wrongInput);
      }
    } catch (e) {
      console.log(
        'WARN\t: ',
        `Timeout waiting for answer from ${author.username} during step ${step.name}`
      );
      author.send(timeoutMessage);
      return null;
    }
  };
  this.processqGeneric = async function processqGeneric(message, q) {
    let botMessage = await message.author.send(q.message);
    if (
      !(collected = await collectFromUser(
        message.author,
        botMessage.channel,
        q,
        (collected) => q.parse(collected.content)
      ))
    ) {
      return false;
    }
    q.answer = collected.content.toLowerCase();
    return true;
  };

  this.processqSleepTracker = async function processqSleepTracker(message, qSleepTracker) {
    let botMessage = await message.author.send(qSleepTracker_message);
    if (
      !(collected = await collectFromUser(
        message.author,
        botMessage.channel,
        qSleepTracker
      ))
    ) {
      return false;
    }
    qSleepTracker.attachment =
      collected.attachments.size > 0
      ? new Discord.Attachment(collected.attachments.first().url)
      : null;
    qSleepTracker.answer = collected.content ? '\n' + collected.content : '';
    return true;
  }
}

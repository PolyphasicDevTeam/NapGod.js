const config = require("../../config.json");
const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client();
const UserModel = require("./../models/user.model");
const LogModel = require("./../models/log.model");

const log = 'log';
const logsChannelName = 'adaptation_logs';
// In seconds
const timeout = 100;
const timeoutMessage = 'This session has expired. Please restart from the begining.';
const api_url = 'http://thumb.napchart.com:1771/api/';
const cache_url = 'https://cache.polyphasic.net/cdn/';
const napMaxLength = 45;

const q1_name = 'user_check';
const q1_message = 'The following information was pulled from the database, is it correct? y = yes, n = no';
const q1_sanity = 'Please answer with either y or n.';

const q2_name = 'previous_day';
const q2_message = 'Do you want to log about a previous day? y = yes, n = no';
const q2_sanity = 'Please answer with either y or n.';
const q2_n = 'Please contact a moderator and tell them what information in the previous question was incorrect.';

const q3_name = 'day';
const q3_message = 'Which day do you want to log about? Please write out the number.';
const q3_sanity = 'Please write a valid integer.';
const q3_n = 'Please pick a day before the default one, {0}. If the day you are intending to log about is later than the day displayed please contact a moderator.';

const q4_name = 'day segments';
const q4_message = 'Which cores and naps to you want to log about? If logging about the whole day, simply write X. Otherwise, you can write `C1-3` for your first 3 cores, or `C1 C2` for your first 2 cores. The naps work the same, but with an N instead of a C. Example: `C1-2 N1 N2`';
const q4_sanity = 'Please answer following the instructions above';
const q4_regex = /^(X|([CN][1-9](-[1-9])?[ ,])*([CN][1-9](-[1-9])?))$/;

const q5_name = 'adhere';
const q5_message = 'Did you adhere to your scheduled sleep times perfectly? y = yes, n = no.';
const q5_sanity = 'Please answer with either y or n.';

const q6_name = 'adhere';
const q6_message = `At what times did you sleep since your previously logged session? For example, if your last logged nap was at 07:00-07:20, and you slept at 08:00-09:00, 10:00-10:10 and 15:00-15:20 since then, write out all sleeps (even oversleeps) and separate them with the “,”-sign, like this:
\`08:00-09:00,10:00-10:10,15:00-15:20.\`
Please do not use the AM/PM format.`;
const q6_sanity = 'Please write the times according to the following format, hh.mm-hh.mm,hh.mm-hh.mm… or hhmm-hhmm,hhmm-hhmm..';
const q6_regex = /^([0-9]{2}[.:h]?[0-9]{2}-[0-9]{2}[.:h]?[0-9]{2}[,; ]?)+$/;
const rangesSeparators = /[,; ]/;
const rangeSeparators = /-/;
const hourSeparators = /[.:h]/;

const q7_name = "estimate";
const q7_message = `
Write out the letters corresponding to what you experienced since your previous log. For example, ACEG. If you don't write a particular letter it is assumed that the opposite happened.
A = easy to fall asleep
B = hard to fall asleep
C = easy to wake up (woke up refreshed without sleep inertia)
D = hard to wake up (woke up groggy or with sleep inertia)
E = woke up before the alarm
F = remembered a dream
G = had issues staying productive between sleeps
H = found it hard to focus on simple activities (watching TV etc)
I = experienced large mood swings between sleeps
J = generally bad mood
K = had a bad or irregular appetite
L = experienced memory-related issues
M = experienced microsleeps outside of scheduled sleep times
N = experienced tiredness bombs
O = experienced very rough tiredness bombs
P = was semi-conscious but in a dream-like state outside scheduled sleep times
Q = deviated from normal sleep hygiene procedures (dark period, fasting, routine before sleep etc)
R = could not properly accomplish desired activities
S = switched to alternate activities to stay awake
X = none of the above`;
const q7_sanity = "Please stick to the letters above.";
const q7_regex = /^[A-SX]+$/;
const q7_wrong_input = "Only write X if no other letters match your situation.";

const q7_positives = {
  "A": [0, "It was easy to fall asleep."],
  "B": [0, "It was hard to fall asleep."],
  "C": [0, "I woke up refreshed without sleep inertia."],
  "D": [3, "I woke up groggy with sleep inertia."],
  "E": [0, "I managed to wake up before the alarm."],
  "F": [0, "I remembered a dream."],
  "G": [1, "I had issues staying productive between sleeps."],
  "H": [2, "I found it hard to focus on simple activities."],
  "I": [0, "I experienced large mood swings between sleeps."],
  "J": [0, "I generally had a bad mood."],
  "K": [0, "I had a bad or irregular appetite."],
  "L": [0, "I experienced memory-related issues."],
  "M": [2, "I experienced microsleeps outside of my scheduled sleep times."],
  "N": [1, "I experienced tiredness bombs."],
  "O": [3, "I experienced very rough tiredness bombs."],
  "P": [2, "I was semi-conscious but in a dream-like state outside scheduled sleep times."],
  "Q": [0, "I deviated from normal sleep hygiene procedures (dark period, fasting, routine before sleep etc)."],
  "R": [0, "I could not properly accomplish desired activities."],
  "S": [1, "I switched to alternate activities to stay awake."]
};

const q7_negatives = {
  "F": [0, "I sadly do not remember any dream."],
  "G": [0, "I did not find it hard staying productive between sleeps."],
  "H": [0, "I found it easy to focus on simple activities."],
  "R": [0, "I properly accomplished desired activities."],
};

const q8_name = 'stay_awake';
const q8_message = 'How hard was it to stay awake on a scale from 1 to 7, where 1 is really easy and 7 is really hard? Based on your answers so far it has been approximated that your difficulty staying awake was {0}';
const q8_sanity = 'Only write a number between 1 and 7.';
const q8_recap = [
  'It was very easy to stay awake',
  'It was easy to stay awake',
  'It was somewhat easy to stay awake',
  'It was moderately difficult to stay awake',
  'It was somewhat hard to stay awake',
  'It was hard to stay awake',
  'It was very hard to stay awake'
];

const q9_name = 'recap';
const q9_message = `If you have anything else to add please write it here, otherwise write “X”. The current message looks like this:\n`;

const q10_name = 'sleep_tracker';
const q10_message = 'If you have an EEG graph you want to include, please post it now, otherwise write ”X”.';

const end = 'Thank you!';

const titleTemplate = `{0} day {1}`;
const descriptionTemplate = `Total sleep time: {0}\n`;

if (!String.format) {
  String.format = function(format) {
    let args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

module.exports = {
  processLog: async function(command, message, args, dry=false) {
    if (command !== log) {
      return false;
    }

    console.log(`CMD   : ${log.toUpperCase()}`);

    const member = getMember(message);
    if (!member) {
      message.author.send('You must join the Polyphasic Sleeping server if you want to post adaptation logs.');
      return true;
    }
    let displayName = member.nickname;
    if (!displayName) {
      displayName = message.author.username;
    }

    message.author.send('In order to generate your adaptation log, the bot needs to have a dozen questions answered. Please answer the following ones.');

    let { schedule, napchartUrl, currentDay, attempt, dateSet, historicLogged, memberData } = await getMemberData(message, displayName);
    if (!schedule) {
      message.author.send('You must first set a schedule and a napchart before writing a log.');
      return true;
    }

    let napchart = getNapchart(displayName, napchartUrl);
    if (napchart === null) {
      message.author.send('Error retrieving napchart data from API.');
      return true;
    }

    let q1 = {name: q1_name, sanity: q1_sanity, check: -1};
    if (!await processQ1(message, q1, schedule, napchart, currentDay, dateSet)) {
      return true;
    }

    if (!q1.check) {
      let q2 = {name: q2_name, sanity: q2_sanity, check: -1};
      if (!await processQ2(message, q2)) {
        return true;
      }

      let q3 = {name: q3_name, sanity: q3_sanity, day: -1};
      if (!await processQ3(message, currentDay, q3)) {
        return true;
      }
      currentDay = q3.day;
    }

    let currentdayLogs = await getLogs({userName: displayName, schedule: schedule, day: currentDay, attempt: attempt});

    const napchartSleeps = minutify_sleeps(extract_ranges(napchart.sleeps));

    let q4 = {name: q4_name, sanity: q4_sanity, answer: null, rawAnswer: ''};
    if (!await processQ4(message, napchartSleeps, q4)) {
      return true;
    }

    let totalSleepTime = 0;
    q4.answer.cores.forEach(core => totalSleepTime += napchartSleeps.cores[core - 1].diff);
    q4.answer.naps.forEach(nap => totalSleepTime += napchartSleeps.naps[nap - 1].diff);

    if (currentdayLogs) {
      if (currentdayLogs.some(el => {
        let daySegments = processSegments(el.daySegments, {cores: [], naps: []}, napchartSleeps, null);
        if (daySegments.cores.some(c => q4.answer.cores.includes(c)) || daySegments.naps.some(n => q4.answer.naps.includes(n))) {
          message.author.send(`You've already logged about ${el.daySegments}. Try again from the begining.`);
          return true;
        }
        return false;
      })) {
        return true;
      }
    }

    let q5 = {name: q5_name, sanity: q5_sanity, answer: -1};
    if (!await processQ5(message, q5)) {
      return true;
    }

    let q6 = {name: q6_name, sanity: q6_sanity, naps: 0, oversleepMinutes: 0};
    if (!q5.answer) {
      totalSleepTime = await processQ6(message, q6, napchartSleeps);
      if (totalSleepTime === false) {
        return true;
      }
    }

    let q7 = {name: q7_name, sanity: q7_sanity, estimate: -1, rawAnswer: "", moods: ""};
    if (!await processQ7(message, q7)) {
      return true;
    }

    let q8 = {name: q8_name, sanity: q8_sanity, estimate: -1};
    if (!await processQ8(message, q7, q8)) {
      return true;
    }

    //TODO: setcompare
    let q9 = {name: q9_name, answer: ""};
    let q10 = {name: q10_name, answer: "", attachment: null};

    // Formatting log
    let get_recap = async function() {
      let description = String.format(descriptionTemplate, `${Math.floor(totalSleepTime / 60)} hours ${totalSleepTime % 60} minutes`);
      if (q6.oversleepMinutes) {
        description += `Time oversleeping: ${Math.floor(q6.oversleepMinutes / 60)} hours ${q6.oversleepMinutes % 60} minutes\n`;
      }
      if (q6.naps) {
        description += `Number of naps: ${q6.naps}\n`;
      }

      let segmentTitle = (q4.rawAnswer.charAt(0) == 'X' ? 'Whole day' : q4.rawAnswer);
      let segmentField = `Difficulty staying awake: ${q8_recap[q8.estimate]}\n`;
      segmentField += q7.moods ? `\n${q7.moods}\n` : '';

      if (!await processQ9(message, '```' + description + segmentTitle + '\n' + segmentField, q9)) {
        return { description: null, segmentTitle: null, segmentField: null };
      }
      segmentField += q9.answer ? `\n${q9.answer}\n` : '';

      if (hasRole(member, 'Sleep Tracker')) {
        if (!await processQ10(message, q10)) {
          return { description: null, segmentTitle: null, segmentField: null };
        }
      }
      return { description, segmentTitle, segmentField };
    }

    if (dry) {
      return true;
    }

    // Sending / editing message in logging channel
    let logsChannel = getChannel(message, logsChannelName);
    if (currentdayLogs && currentdayLogs.length > 0) {
      // Editing message
      let foundLog;
      let logMessages;
      do {
        logMessages = await logsChannel.fetchMessages({limit: 100});
        foundLog = logMessages.filter(msg => msg.embeds.length > 0 && msg.embeds[0].author.name == displayName
          && msg.embeds[0].title == String.format(titleTemplate, schedule, currentDay)).first();
        if (foundLog) {
          currentdayLogs.forEach(currentdayLog => {
            totalSleepTime += currentdayLog.sleepTime;
            q6.oversleepMinutes += currentdayLog.oversleepTime ? currentdayLog.oversleepTime : 0;
            q6.naps += currentdayLog.napsNumber ? currentdayLog.napsNumber : 0;
          });
          const { description, segmentTitle, segmentField } = await get_recap();
          if (!description) {
            return true;
          }

          const embed = new Discord.RichEmbed(foundLog.embeds[0])
            .setDescription(description)
            .addField(segmentTitle, segmentField)
            .setTimestamp();

          foundLog.edit(embed);
          if (q10.attachment) {
            logsChannel.send(`${displayName} EEG ${schedule} - ${q4.rawAnswer.charAt(0) == 'X' ? '' : q4.rawAnswer}\n${q10.answer} of day ${currentDay}`, q10.attachment);
          }
        }
      } while (!foundLog && logMessages.length > 0)
      if (!foundLog) {
        console.error(`Could not find a previous log for ${displayName} day ${currentDay}`);
        return true;
      }
    }
    else {
      // Sending message
      const { description, segmentTitle, segmentField } = await get_recap();
      if (!description) {
        return true;
      }
      let colorRole = member.roles.filter(r => ['Nap only', 'Everyman', 'Dual Core', 'Tri Core', 'Biphasic', 'Experimental'].includes(r.name)).first();
      const color = colorRole ? colorRole.color : '#ffffff';
      console.log("URL");
      console.log(api_url + 'getImage?width=600&height=600&chartid=' + napchartUrl.split('/').pop());
      const embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle(String.format(titleTemplate, schedule, currentDay))
        .setAuthor(displayName, message.author.avatarURL)
        .setDescription(description)
        .setThumbnail(cache_url + napchartUrl.split('/').pop() + '.png')
        .addField(segmentTitle, segmentField)
        .setTimestamp();
      logsChannel.send(embed);
      if (q10.attachment) {
        logsChannel.send(`${displayName} EEG ${schedule} - ${q4.rawAnswer.charAt(0) == 'X' ? '' : q4.rawAnswer}\n${q10.answer} of day ${currentDay}`, q10.attachment);
      }
    }

    // Saving the log
    message.author.send(end);
    logInstance = buildLogInstance(displayName, schedule, attempt, currentDay, q4.rawAnswer,
      q7.rawAnswer, q8.estimate,
      totalSleepTime, q6.oversleepMinutes, q6.naps,
      q9.answer ? q9.answer + q10.answer : q10.answer, q10.attachment ? q10.attachment.file : null);

    if (!await saveLogInstance(logInstance, message.author.id)) {
      message.author.send("An error occurred while saving the log");
      return true;
    }

    // Updating consecutive logging of schedule
    let currentScheduleLogs = await getLogs({userName: displayName, schedule: schedule, attempt: attempt});
    let currentScheduleLoggedDays = currentScheduleLogs.map(o => o.day);
    const longestSequence = (arr) => {
      const numbers = new Set(arr), counts = {};
      var max = 0;
      for (const num of numbers.values()) {
        let next = num + 1;
        numbers.delete(num);
        while (numbers.has(next)) { numbers.delete(next++); }
        if (counts[next]) { next += counts[next]; }
        max = Math.max(counts[num] = next - num, max);
      }
      return max;
    }

    memberData.currentScheduleMaxLogged = Math.max(...currentScheduleLoggedDays);
    memberData.save();

    processTimeRoles(message, member, memberData.currentScheduleMaxLogged,
      longestSequence(currentScheduleLoggedDays), historicLogged);
    return true;
  }
}


// Questions processing
// =============================


async function processQ1(message, q1, schedule, napchart, day, dateSet) {
  let botMessage = await message.author.send(q1_message + "\n" +
    "- Schedule: " + schedule + "\n" +
    "- Napchart: " + napchart.url + "\n" +
    "- Day: " + day + "\n" +
    "- Date set: " + dateSet + "\n");

  if (!(collected = await collectFromUser(message.author, botMessage.channel, q1,
    collected => (collected.content.toLowerCase() === "y" || collected.content.toLowerCase() === "n") ? "" : q1_sanity ))) {
    return false;
  }
  q1.check = collected.content.toLowerCase() === "y";
  return true;
}

async function processQ2(message, q2) {
  let botMessage = await message.author.send(q2_message);

  if (!(collected = await collectFromUser(message.author, botMessage.channel, q2,
    collected => (collected.content.toLowerCase() === "y" || collected.content.toLowerCase() === "n") ? "" : q2_sanity ))) {
    return false;
  }
  q2.check = collected.content.toLowerCase() === "Y";
  if (!q2.check) {
    message.author.send(q2_n);
    return false;
  }
  return true;
}

async function processQ3(message, currentDay, q3) {
  let botMessage = await message.author.send(q3_message);
  while (q3.day === -1) {
    if (!(collected = await collectFromUser(message.author, botMessage.channel, q3,
      collected => (/^(0|[1-9]\d*)$/.test(collected.content)) ? "" : q3_sanity))) {
      return false;
    }
    if (collected.content > currentDay) {
      botMessage = await message.author.send(String.format(q3_n, currentDay));
    }
    else {
      q3.day = collected.content;
    }
  }
  return true;
}

function formatMinute(time) {
  if (time % 60 === 0) {
    return '00';
  }
  if (time % 60 < 10) {
    return '0' + time % 60;
  }
  return time % 60;
}

async function processQ4(message, napchartSleeps, q4) {
  let cores = "Cores:\n";
  let naps = "\nNaps:\n";
  napchartSleeps.cores.forEach((core, i) => {
    let end = core.end > 24*60 ? core.end -24*60 : core.end;
    cores += `\`C${i+1}\`: ${Math.floor(core.begin / 60)}h${formatMinute(core.begin)}-${Math.floor(end / 60)}h${formatMinute(end)}`;
  });
  napchartSleeps.naps.forEach((nap, i) => {
    let end = nap.end > 24*60 ? nap.end -24*60 : nap.end;
    naps += `\`N${i+1}\`: ${Math.floor(nap.begin / 60)}h${formatMinute(nap.begin)}-${Math.floor(end / 60)}h${formatMinute(end)}`;
  });

  while (!q4.answer) {
    let botMessage = await message.author.send(q4_message + "\n" + cores + naps);

    if (!(collected = await collectFromUser(message.author, botMessage.channel, q4,
      collected => q4_regex.test(collected.content.toUpperCase()) ? "" : q4_sanity))) {
      return false;
    }
    q4.rawAnswer = collected.content;
    q4.answer = processSegments(collected.content.toUpperCase(), {cores: [], naps: []}, napchartSleeps, message);
  }
  return true;
}

function processSegments(str, out, napchartSleeps, message) {
  if (str.charAt(0) == 'X') {
    for (i = 0; i < napchartSleeps.cores.length; i++){
      out.cores[i] = 1;
    }
    for (i = 0; i < napchartSleeps.naps.length; i++){
      out.naps[i] = 1;
    }
  }
  else {
    let segments = str.split(/[, ]/);
    for (const segment of segments) {
      if (!(done = processSegment(message, napchartSleeps, segment, out))) {
        return null;
      }
    }
  }
  return out;
}

function processSegment(message, napchartSleeps, segment, out) {
  let begin = parseInt(segment.charAt(1)) - 1;
  let end = begin;
  if (segment.length > 3) {
    end = parseInt(segment.substring(3)) - 1;
  }
  for (i = begin; i <= end; i++) {
    if (segment.charAt(0) == 'C') {
      if (end >= napchartSleeps.cores.length) {
        if (message) {
          message.author.send(`You seem to not have a core #${end + 1} in your schedule!`);
        }
        return false;
      }
      out.cores[i] = 1;
    }
    else {
      if (end >= napchartSleeps.naps.length) {
        if (message) {
          message.author.send(`You seem to not have a nap #${end + 1} in your schedule!`);
        }
        return false;
      }
      out.naps[i] = 1;
    }
  }
  return true;
}

async function processQ5(message, q5) {
  let botMessage = await message.author.send(q5_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q5,
    collected => (collected.content.toLowerCase() === "y" || collected.content.toLowerCase() === "n") ? "" : q5_sanity))) {
    return false;
  }
  q5.answer = collected.content.toLowerCase() === "y";
  return true;
}

async function processQ6(message, q6, napchartSleeps, schedule) {
  let botMessage = await message.author.send(q6_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q6,
    collected => check_ranges(collected.content)))) {
    return false;
  }
  let sleeps = minutify_sleeps(extract_ranges(collected.content));
  for (const sleep of sleeps.cores.concat(sleeps.naps)) {
    let bestDiff = 9999;
    for (const chartSleep of napchartSleeps.cores.concat(napchartSleeps.naps)) {
      let diff = 0;
      diff += sleep.begin < chartSleep.begin ? chartSleep.begin - sleep.begin : 0;
      diff += sleep.end > chartSleep.end ? sleep.end - chartSleep.end : 0;
      bestDiff = Math.min(diff, bestDiff);
    }

    if ((schedule === "DUCAMAYL" || schedule === "SEVAMAYL" || schedule === "SPAMAYL") && sleep.diff <= napMaxLength) {
      q6.naps++;
    } else {
      q6.oversleepMinutes += Math.min(bestDiff, sleep.diff);
    }
  }
  return sleeps.totalSleepTime;
}

async function processQ7(message, q7) {
  let botMessage = await message.author.send(q7_message);
  while (q7.estimate === -1) {
    if (!(collected = await collectFromUser(message.author, botMessage.channel, q7,
      collected => q7_regex.test(collected.content.toUpperCase() ? "" : q7_sanity)))) {
      return false;
    }
    q7.rawAnswer = collected.content.toUpperCase();
    if (q7.rawAnswer.includes("X")) {
      if (q7.rawAnswer.length > 1) {
        botMessage = await message.author.send(q7_wrong_input);
      } else {
        q7.estimate = 0;
      }
    } else {
      q7.estimate = !q7.rawAnswer.includes("C") && !q7.rawAnswer.includes("D");
    }
  }
  for (const [letter, value] of Object.entries(q7_positives)) {
    if (q7.rawAnswer.includes(letter)) {
      if (q7.moods) {
        q7.moods += " ";
      }
      q7.estimate += value[0];
      q7.moods += value[1];
    }
  }
  for (const [letter, value] of Object.entries(q7_negatives)) {
    if (!q7.rawAnswer.includes(letter)) {
      if (q7.moods) {
        q7.moods += " ";
      }
      q7.estimate += value[0];
      q7.moods += value[1];
    }
  }
  q7.estimate = Math.floor((q7.estimate + 2) / 2);
  return true;
}

async function processQ8(message, q7, q8) {
  let botMessage = await message.author.send(String.format(q8_message, q7.estimate));
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q8,
    collected => /^[1-7]$/.test(collected.content) ? "" : q8_sanity))) {
    return false;
  }
  q8.estimate = parseInt(collected.content);
  return true;
}

async function processQ9(message, recap, q9) {
  let botMessage = await message.author.send(q9_message + "\n" + recap + '```');
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q9, collected => ""))) {
    return false;
  }
  q9.answer = collected.content.toLowerCase() === "x" ? "" : collected.content;
  return true;
}

async function processQ10(message, q10) {
  let botMessage = await message.author.send(q10_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q10, collected => ""))) {
    return false;
  }
  q10.attachment = collected.attachments.size > 0 ? new Discord.Attachment(collected.attachments.first().url) : null;
  q10.answer = collected.content ? "\n" + collected.content : "";
  return true;
}

async function collectFromUser(author, channel, step, checkInput) {
  try {
    while (true) {
      let collected = await channel.awaitMessages(x => x.author.id === author.id, { maxMatches: 1, time: timeout * 1000, errors: ['time'] });
      let wrongInput = checkInput(collected.first());
      if (!wrongInput) {
        return collected.first();
      }
      author.send(wrongInput);
    }
  }
  catch (e) {
    console.log("WARN\t: ", `Timeout waiting for answer from ${author.username} during step ${step.name}`);
    author.send(timeoutMessage);
    return null;
  }
}

function insertSort(arr, el) {
  let i = arr.length - 1;
  for (; i >= 0 && ((arr[i].end > el.end && !(arr[i].end > 24*60)) || el.end > 24*60); i--) {
    arr[i + 1] = arr[i];
  }
  arr[i + 1] = el;
}

function minutify_sleeps(sleeps) {
  let out = { cores: [], naps: [], totalSleepTime: 0 };
  if (sleeps.length % 4 != 0) {
    console.error("Sleeps: %o of length of multiple different than 4", sleeps);
    return out;
  }
  for (i = 0; i < sleeps.length; i += 4) {
    if (sleeps[i + 2] < sleeps[i]) {
      sleeps[i + 2] += 24;
    }
    let range = {
      begin: sleeps[i] * 60 + sleeps[i + 1],
      end: sleeps[i + 2] * 60 + sleeps[i + 3]
    };
    range.diff = range.end - range.begin;
    if (range.diff <= napMaxLength) {
      insertSort(out.naps, range);
    }
    else {
      insertSort(out.cores, range);
    }
    out.totalSleepTime += range.diff;
  }
  return out;
}

function check_ranges(ranges) {
  if (!q6_regex.test(ranges))
    return q6_sanity;
  ranges.split(rangesSeparators).forEach(range => range.split(rangeSeparators).forEach((time) => {
    if (!hourSeparators.test(time))
      time = time.substr(0, 2) + '-' + time.substr(2);
    time = time.split(hourSeparators);
    if (parseInt(time[0]) > 60)
      return `Hours must be between 0 and 23 (got ${parseInt(time[0])})`;
    if (parseInt(time[1]) > 23)
      return `Minutes must be between 0 and 60 (got ${parseInt(time[1])})`;
  }));
  return null;
}

function extract_ranges(ranges) {
  let out = [];
  ranges.split(rangesSeparators).forEach(range => range.split(rangeSeparators).forEach((time) => {
    if (!hourSeparators.test(time)) {
      out = out.concat([time.substr(0, 2), time.substr(2)]);
    }
    else {
      out = out.concat(time.split(hourSeparators));
    }
  }));
  return out.map(x => parseInt(x));
}

function getNapchart(username, napchartUrl) {
  let napchart = { url: napchartUrl, sleeps: "" };
  request.get({
    url: api_url + 'get?chartid=' + napchart.url.split('/').pop(),
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.error(`ERR\t: Fetching napchart times for user ${username}: ${err}`);
      return null;
    } else if (res.statusCode != 200) {
      console.error(`ERR\t: Napchart api returned ${res.statusCode} fetching ${username}'s napchart`);
      return null;
    } else {
      data.chartData.elements.forEach(element => {
        if (element.color === 'red' && element.lane === 0) {
          if (napchart.sleeps) {
            napchart.sleeps += ",";
          }
          napchart.sleeps += `${("00" + Math.floor(element.start / 60)).substr(-2)}${("00" + element.start % 60).substr(-2)}-`;
          napchart.sleeps += `${("00" + Math.floor(element.end / 60)).substr(-2)}${("00" + element.end % 60).substr(-2)}`;
        }
      });
    }
  });
  return napchart;
}


function getMember(message) {
  const guild = getGuild(message);
  const userId = message.author.id;
  return guild.members.find(member => member.user.id === userId);
}

function getChannel(message, channelName) {
  const guild = getGuild(message);
  return guild.channels.find(channel => channel.name === channelName);
}

function getGuild(message) {
  return message.client.guilds.first();
}

function hasRole(member, role) {
  return member.roles.find(role => role.name == role);
}

function processTimeRoles(message, member, currentScheduleMaxLogged, maxConsecutive, historicLogged) {
  let oneMonthRole = getGuild(message).roles.find(role => role.name == "1 mths poly");
  let threeMonthsRole = getGuild(message).roles.find(role => role.name == "3 mths poly");
  let sixMonthsRole = getGuild(message).roles.find(role => role.name == "6 mths poly");
  let oneYearRole = getGuild(message).roles.find(role =>  role.name == "1+ year poly");
  let loggerRole = getGuild(message).roles.find(role => role.name == "Logger");

  if (maxConsecutive > 30 && !member.roles.has(loggerRole.id)) {
    member.addRole(loggerRole).catch(console.error);
  }

  if (currentScheduleMaxLogged + historicLogged > 365) {
    if (!member.roles.has(oneYearRole.id)) { member.addRole(oneYearRole).catch(console.error); }
    if (member.roles.has(sixMonthsRole.id)) { member.removeRole(sixMonthsRole).catch(console.error); }
  }
  if (currentScheduleMaxLogged + historicLogged > 182) {
    if (!member.roles.has(sixMonthsRole.id)) { member.addRole(sixMonthsRole).catch(console.error); }
    if (member.roles.has(threeMonthsRole.id)) { member.removeRole(threeMonthsRole).catch(console.error); }
  }
  if (currentScheduleMaxLogged + historicLogged > 91) {
    if (!member.roles.has(threeMonthsRole.id)) { member.addRole(threeMonthsRole).catch(console.error); }
    if (member.roles.has(oneMonthRole.id)) { member.removeRole(oneMonthRole).catch(console.error); }
  }
  if (currentScheduleMaxLogged + historicLogged > 30) {
    if (!member.roles.has(oneMonthRole.id)) { member.addRole(oneMonthRole).catch(console.error); }
  }
}


// DB retrieval / saving
// =======================


async function getMemberData(message, displayName) {
  let res;
  try {
    res = await UserModel.findOne({id: message.author.id});
  } catch (err) {
    console.warn("WARN  : ", "Could not get user: ", err);
  }

  if (res && res.currentScheduleChart && res.currentScheduleName) {
    let d = new Date(res.updatedAt);
    let today = new Date();

    let dateSet = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let currentDay = Math.floor((today.getTime() - d.getTime()) / (1000 * 3600 * 24))
      + (d.getHours() > today.getHours() ? 1 : 0);
    let schedule = res.currentScheduleName;
    let napchartUrl = res.currentScheduleChart;
    let attempt = res.historicSchedules.filter(s => s.name == schedule).length;

    if (!res.historicSchedules[0].maxLogged || res.historicSchedules[0].maxLogged == -Infinity) {
      let schedulesAttempted = res.historicSchedules.map(s => s.name);
      for (const scheduleAttempted of schedulesAttempted) {
        let scheduleAttempts = res.historicSchedules.filter(s => s.name == scheduleAttempted);
        for (i = 0; i < scheduleAttempts.length; i++) {
          let scheduleAttemptLogs = await getLogs({userName: displayName, schedule: scheduleAttempted, attempt: i});
          scheduleAttempts[i].maxLogged = scheduleAttemptLogs.length ? Math.max(...scheduleAttemptLogs.map(l => l.day)) : 0;
        }
      }
    }

    let historicLogged = res.historicSchedules.reduce((acc, sched) => acc + sched.maxLogged, 0);

    res.save();
    return { schedule, napchartUrl, currentDay, attempt, dateSet, historicLogged, memberData: res };
  }
  return { schedule: null, napchart: null, currentDay: null, attempt: null, dateSet: null, historicLogged: null, memberData: null };
}

async function getLogs(filter) {
  let res = null;
  try {
    res = await LogModel.find(filter);
  }
  catch (err) {
    console.warn("WARN  : ", "Could not get log: ", err);
  }
  return res;
}

function buildLogInstance(username, schedule, attempt, day, daySegments, moods, awakeDifficulty, sleepTime, oversleepTime, napsNumber, logMessage, attachment) {
  let logInstance = {
    userName: username,
    schedule: schedule,
    attempt: attempt,
    day: day,
    daySegments: daySegments,
    moods: moods,
    awakeDifficulty: awakeDifficulty,
    sleepTime: sleepTime
  };

  if (oversleepTime) {
    logInstance.oversleepTime = oversleepTime;
  }
  if (napsNumber) {
    logInstance.napsNumber = napsNumber;
  }
  if (attachment) {
    logInstance.attachment = attachment;
  }
  if (logMessage) {
    logInstance.logMessage = logMessage;
  }
  return logInstance;
}

async function saveLogInstance(logInstance, userId) {
  try {
    await LogModel.create(logInstance, (error, result) => {
      if (error) {
        console.warn("Error inserting log: ", error);
        throw error;
      }
    });
  } catch (error) {
    return false;
  }
  return true;
}

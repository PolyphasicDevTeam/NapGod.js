const config = require("../../config.json");
const Discord = require('discord.js');
const request = require('request');
const client = new Discord.Client()
const UserModel = require("./../models/user.model");

const log = 'log';
const logsChannelName = 'adaptation_logs';
// In miliseconds
const timeout = 100 * 1000;
const api_url = 'http://thumb.napchart.com:1771/api/get?chartid='

const q1_name = 'user_check';
const q1_message = 'The following information was pulled from the database, is it correct? Y = yes, N = no'
const q1_sanity = 'Please answer with either Y or N.'

const q2_name = 'previous_day';
const q2_message = 'Do you want to log about a previous day? Y = yes, N = no'
const q2_sanity = 'Please answer with either Y or N.'
const q2_n = 'Please contact a moderator and tell them what information in the previous question was incorrect.'

const q3_name = 'day'
const q3_message = 'Which day do you want to log about? Please write out the number.'
const q3_sanity = 'Please write a valid integer.'
const q3_n = 'Please pick a day before the default one, {0}. If the day you are intending to log about is later than the day displayed please contact a moderator.'

const q4_name = 'adhere'
const q4_message = 'Did you adhere to your scheduled sleep times perfectly? Y = yes, N = no.'
const q4_sanity = 'Please answer with either Y or N.'

const q4half_name = 'adhere'
const q4half_message = `At what times did you sleep since your previously logged session? For example, if your last logged nap was at 07:00-07:20, and you slept at 08:00-09:00, 10:00-10:10 and 15:00-15:20 since then, write out all sleeps (even oversleeps) and separate them with the “,”-sign, like this:
\`08:00-09:00,10:00-10:10,15:00-15:20.\`
Please do not use the AM/PM format.`
const q4half_sanity = 'Please write the times according to the following format, hh.mm-hh.mm,hh.mm-hh.mm… or hhmm-hhmm,hhmm-hhmm..'
const q4half_regex = /^([0-9]{2}[.:h]?[0-9]{2}-[0-9]{2}[.:h]?[0-9]{2}[,; ]?)+$/
const rangesSeparators = /[,; ]/
const rangeSeparators = /-/
const hourSeparators = /[.:h]/

const q5_name = "estimate"
const q5_message = `
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
X = none of the above`
const q5_sanity = "Please stick to the letters above."
const q5_regex = /^[A-SX]+$/
const q5_wrong_input = "Only write X if no other letters match your situation."

const q5_positives = {
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

const q5_negatives = {
  "E": [0, "I did not manage to wake up before the alarm."],
  "F": [0, "I did not remember any dream."],
  "G": [0, "I did not have any issue staying productive between sleeps."],
  "H": [0, "I found it easy to focus on simple activities."],
  "I": [0, "I did not experience any mood swing between sleeps."],
  "J": [0, "I generally had a good mood."],
  "K": [0, "I had a regular appetite."],
  "L": [0, "I did not experience any memory-related issue."],
  "M": [0, "I did not experience microsleeps outside of my scheduled sleep times."],
  "N": [0, "I did not experience any tiredness bombs."],
  "O": [0, "My tiredness bombs were not very rough."],
  "P": [0, "I was conscious and not in a dream-like state outside scheduled sleep times."],
  "Q": [0, "I did not deviate from normal sleep hygiene procedures."],
  "R": [0, "I properly accomplished desired activities."],
  "S": [0, "I did not switch to alternative activities to stay awake."]
};

const q6_name = 'stay_awake'
const q6_message = 'How hard was it to stay awake on a scale from 1 to 7, where 1 is really easy and 7 is really hard? Based on your answers so far it has been approximated that your difficulty staying awake was {0}'
const q6_sanity = 'Only write a number between 1 and 7.'
const q6_recap = [
  'It was very easy to stay awake',
  'It was easy to stay awake',
  'It was somewhat easy to stay awake',
  'It was moderately difficult to stay awake',
  'It was somewhat hard to stay awake',
  'It was hard to stay awake',
  'It was very hard to stay awake'
];

const q7_name = 'recap'
const q7_message = `If you have anything else to add please write it here, otherwise write “X”. The current message looks like this:\n`

const q8_name = 'sleep_tracker'
const q8_message = 'If you have an EEG graph you want to include, please post it now, otherwise write ”X”.'

const end = 'Thank you!'

const recap_template = `\`\`\`Name: {0}
Schedule: {1}
Day: {2}
Difficulty staying awake: {3}
Total sleep time: {4}\n`

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
    if (dry) {
      return true;
    }

    const member = getMember(message);
    if (!member) {
      message.author.send('You must join the Polyphasic Sleeping server if you want to post adaptation logs.');
      return true;
    }
    let displayName = member.nickname
    if (!displayName) {
      displayName = message.author.username
    }

    let { schedule, napchartUrl, currentDay, dateSet } = await getMemberData(message);
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
      let q2 = {name: q2_name, sanity: q2_sanity, check: -1}
      if (!await processQ2(message, q2)) {
        return true;
      }

      let q3 = {name: q3_name, sanity: q3_sanity, day: -1}
      if (!await processQ3(message, q3)) {
        return true;
      }
      currentDay = q3.day;
    }

    let q4 = {name: q4_name, sanity: q4_sanity, answer: -1}
    if (!await processQ4(message, q4)) {
      return true;
    }

    let totalSleepTime = 0;
    const napchartSleeps = minutify_sleeps(extract_ranges(napchart.sleeps));

    let q4half = {name: q4half_name, sanity: q4half_sanity, naps: 0, oversleepMinutes: 0}
    if (q4.answer) {
      totalSleepTime = calculateSleepTime(napchartSleeps);
    } else if ((totalSleepTime = await processQ4half(message, q4half, napchartSleeps) === false)) {
      return true;
    }

    let q5 = {name: q5_name, sanity: q5_sanity, estimate: -1, moods: ""};
    if (!await processQ5(message, q5)) {
      return true;
    }

    let q6 = {name: q6_name, sanity: q6_sanity, estimate: -1};
    if (!await processQ6(message, q5, q6)) {
      return true;
    }

    //TODO: q6.5: setcompare

    let recap = String.format(recap_template, displayName, schedule, currentDay, q6_recap[q6.estimate],
      `${Math.floor(totalSleepTime / 60)} hours ${totalSleepTime % 60} minutes`);
    if (q4half.oversleepMinutes) {
      recap += `Time oversleeping: ${Math.floor(q4half.oversleepMinutes / 60)} hours ${q4half.oversleepMinutes % 60} minutes\n`
    }
    if (q4half.naps) {
      recap += `Number of naps: ${q4half.naps}\n`
    }
    if (q5.moods) {
      recap += "\n" + q5.moods;
    }

    let q7 = {name: q7_name, answer: ""};
    if (!await processQ7(message, recap, q7)) {
      return true;
    }
    if (q7.answer != "") {
      recap += "\n\n" + q7.answer + '\n';
    }
    recap += '```';

    let q8 = {name: q8_name, answer: "", attachment: null};
    if (hasSleepTrackerRole(member)) {
      if (!await processQ8(message, q8)) {
        return true;
      }
    }

    message.author.send(end);
    if (q8.attachment) {
      getChannel(message, logsChannelName).send(recap + q8.answer, q8.attachment);
    }
    else {
      getChannel(message, logsChannelName).send(recap);
    }
    return true
  }
}

async function processQ1(message, q1, schedule, napchart, day, dateSet) {
  let botMessage = await message.author.send(q1_message + "\n" +
    "- Schedule: " + schedule + "\n" +
    "- Napchart: " + napchart.url + "\n" +
    "- Day: " + day + "\n" +
    "- Date set: " + dateSet + "\n");

  if (!(collected = await collectFromUser(message.author, botMessage.channel, q1,
    collected => (collected.content === "Y" || collected.content === "N") ? "" : q1_sanity ))) {
    return false;
  }
  q1.check = collected.content === "Y";
  return true;
}

async function processQ2(message, q2) {
  let botMessage = await message.author.send(q2_message);

  if (!(collected = await collectFromUser(message.author, botMessage.channel, q2,
    collected => (collected.content === "Y" || collected.content === "N") ? "" : q2_sanity ))) {
    return false;
  }
  q2.check = collected.content === "Y";
  if (!q2.check) {
    message.author.send(q2_n);
    return false;
  }
  return true;
}

async function processQ3(message, q3) {
  let botMessage = await message.author.send(q3_message);
  while (q3.day === -1) {
    if (!(collected = await collectFromUser(message.author, botMessage.channel, q3,
      collected => (/^(0|[1-9]\d*)$/.test(collected.content)) ? "" : q3_sanity))) {
      return false;
    }
    if (collected.content > day) {
      botMessage = await message.author.send(String.format(q3_n, day));
    }
    else {
      q3.day = collected.content;
    }
  }
  return true;
}

async function processQ4(message, q4) {
  let botMessage = await message.author.send(q4_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q4,
    collected => (collected.content === "Y" || collected.content === "N") ? "" : q4_sanity))) {
    return false;
  }
  q4.answer = collected.content === "Y";
  return true;
}

async function processQ4half(message, q4half, napchartSleeps, schedule) {
  let botMessage = await message.author.send(q4half_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q4half,
    collected => check_ranges(collected.content)))) {
    return false;
  }
  let sleeps = minutify_sleeps(extract_ranges(collected.content));
  for (i = 0, bestDiff = 9999; i < sleeps.length; i += 2, bestDiff = 9999) {
    for (j = 0, diff = 0; j < napchartSleeps.length; j += 2, diff = 0) {
      diff += sleeps[i] < napchartSleeps[j] ? napchartSleeps[j] - sleeps[i] : 0;
      diff += sleeps[i + 1] > napchartSleeps[j + 1] ? sleeps[i + 1] - napchartSleeps[j + 1] : 0;
      bestDiff = Math.min(diff, bestDiff);
    }
    if ((schedule === "DUCAMAYL" || schedule === "SEVAMAYL" || schedule === "SPAMAYL") && sleeps[i + 1] - sleeps[i] <= 45) {
      q4half.naps++;
    } else {
      q4half.oversleepMinutes += Math.min(bestDiff, sleeps[i + 1] - sleeps[i]);
    }
  }
  return calculateSleepTime(sleeps);
}

async function processQ5(message, q5) {
  let botMessage = await message.author.send(q5_message);
  while (q5.estimate === -1) {
    if (!(collected = await collectFromUser(message.author, botMessage.channel, q5,
      collected => q5_regex.test(collected.content.toUpperCase() ? "" : q5_sanity)))) {
      return false;
    }
    collected.content = collected.content.toUpperCase();
    if (collected.content.includes("X")) {
      if (collected.content.length > 1) {
        botMessage = await message.author.send(q5_wrong_input);
      } else {
        q5.estimate = 0;
      }
    } else {
      q5.estimate = !collected.content.includes("C") && !collected.content.includes("D");
    }
  }
  q5.estimate = (q5.estimate + 2) / 2;
  for (const [letter, value] of Object.entries(q5_positives)) {
    if (collected.content.includes(letter)) {
      if (q5.moods) {
        q5.moods += " ";
      }
      q5.estimate += value[0];
      q5.moods += value[1];
    }
  }
  for (const [letter, value] of Object.entries(q5_negatives)) {
    if (!collected.content.includes(letter)) {
      if (q5.moods) {
        q5.moods += " ";
      }
      q5.estimate += value[0];
      q5.moods += value[1];
    }
  }
  return true;
}

async function processQ6(message, q5, q6) {
  let botMessage = await message.author.send(String.format(q6_message, q5.estimate));
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q6,
    collected => /^[1-7]$/.test(collected.content) ? "" : q6_sanity))) {
    return false;
  }
  q6.estimate = parseInt(collected.content);
  return true;
}

async function processQ7(message, recap, q7) {
  let botMessage = await message.author.send(q7_message + "\n" + recap + '```');
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q7, collected => ""))) {
    return false;
  }
  q7.answer = collected.content === "X" ? "" : collected.content;
  return true;
}

async function processQ8(message, q8) {
  let botMessage = await message.author.send(q8_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q8, collected => ""))) {
    return false;
  }
  q8.attachment = collected.attachments.size > 0 ? new Discord.Attachment(collected.attachments.first().url) : null;
  q8.answer = collected.content ? "\n" + collected.content : "";
  return true;
}

async function collectFromUser(author, channel, step, checkInput) {
  try {
    while (true) {
      let collected = await channel.awaitMessages(x => x.author.id === author.id, { maxMatches: 1, time: timeout, errors: ['time'] });
      let wrongInput = checkInput(collected.first());
      if (!wrongInput) {
        return collected.first();
      }
      author.send(wrongInput);
    }
  }
  catch (e) {
    console.log("WARN\t: ", `${e} Timeout waiting for answer from ${author.username} during step ${step.name}`);
    return null;
  }
}

function calculateSleepTime(minutes) {
  let out = 0;
  for (i = 0; i < minutes.length; i += 2) {
    out += minutes[i + 1] - minutes[i];
  }
  return out;
}

function minutify_sleeps(sleeps) {
  let out = [];
  for (i = 0; i < sleeps.length; i += 2) {
    out.push(sleeps[i] * 60 + sleeps[i + 1]);
    if (i + 2 < sleeps.length && sleeps[i + 2] < sleeps[i]) {
      sleeps[i + 2] += 24;
    }
  }
  return out;
}

function check_ranges(ranges) {
  if (!q4half_regex.test(ranges))
    return q4half_sanity;
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
    url: api_url + napchart.url.split('/').filter(el => el).pop(),
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log(`ERR\t: Fetching napchart times for user ${username}: ${err}`);
      return null;
    } else if (res.statusCode != 200) {
      console.log(`ERR\t: Napchart api returned ${res.statusCode} fetching ${username}'s napchart`);
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

async function getMemberData(message) {
  // Getting data from db
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

    return { schedule, napchartUrl, currentDay, dateSet };
  }
  return { schedule: null, napchart: null, currentDay: null, dateSet: null };
}

function hasSleepTrackerRole(member) {
  return member.roles.find('name', 'Sleep Tracker');
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

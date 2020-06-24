const config = require("../../config.json");
const Discord = require('discord.js');
const request = require('request');
const BitSet = require('bitset');
const client = new Discord.Client();
const UserModel = require("./../models/user.model");
const LogModel = require("./../models/log.model");

const logCMD = 'log';
const logsChannelName = 'adaptation_logs';
const flexibleSchedules = ["DUCAMAYL", "SEVAMAYL", "SPAMAYL", "Random"];

// In seconds
const timeout = 500;
const timeoutMessage = 'This session has expired. Please restart from the begining.';
const api_url = 'http://thumb.napchart.com:1771/api/';
const cache_url = 'https://cache.polyphasic.net/cdn/';
const napMaxLength = 45;

let currentUsers = [];

const qUserName_name = 'user check';
const qUserName_message = 'The following information was pulled from the database, is it correct? `y` = yes, `n` = no';
const qUserName_sanity = 'Please answer with either `y` or `n`.';

// Schedule First Log
const qSFLagreement_message = 'Hello! Are you OK with answering a few extra questions since this is your first time logging on this schedule? `y` = yes, `n` = no';
const qSFLagreement_sanity = 'Please answer with either `y` or `n`.';
const qSFLagreement_regex = /^[yYnN]$/;

const qSFLmonoSleep_message = "How much sleep do you need when you are sleeping monophasically (in hours)? Typing `?` = I don't know.";
const qSFLmonoSleep_sanity = 'Please simply answer with a reasonable number of hours, without any other character, or `?`.';
const qSFLmonoSleep_regex = /^\?|1[0-2]|[5-9]$/;

const qSFLexperience_message = 'Are you an experienced polyphasic sleeper? `y` = yes, `n` = no';
const qSFLexperience_sanity = 'Please answer with either `y` or `n`.';
const qSFLexperience_regex = /^[yYnN]$/;

const qSFLpreviousFeeling_message = "How good did you feel on your previous schedule on a scale from 1 to 7? Typing `?` = I don't know";
const qSFLpreviousFeeling_sanity = 'Please answer with either `?` or a number from 1 to 7.';
const qSFLpreviousFeeling_regex = /^\?|[1-7]$/;

const qSFLsleepDep_message = 'Are you sleep deprived right now? `y` = yes, `n` = no';
const qSFLsleepDep_sanity = 'Please answer with either `y` or `n`.';
const qSFLsleepDep_regex = /^[yYnN]$/;

const qSFLpreviousSched_message = 'Was your previous schedule monophasic sleep? `y` = yes, `n` = no';
const qSFLpreviousSched_sanity = 'Please answer with either `y` or `n`.';
const qSFLpreviousSched_regex = /^[yYnN]$/;

const qSFLmonoDep_message = `
Which of the following scenarios describes your current attempt the best?
a/ I started by sleeping less than I need, but still got some sleep.
b/ I started by purposefully skipping my whole core.
c/ I started by napping every few hours before switching to my current schedule.
d/ I would have to catch up on sleep every weekend/I would have different rhythms on the weekend vs weekdays
e/ I don't know"
`;
const qSFLmonoDep_sanity = 'Please answer with either `e` or a combination of `abcd`.';
const qSFLmonoDep_regex = /^e|[a-d]+$/;

const qSFLpolyDep_message = `
Which of the following scenarios describes your current attempt the best?
a/ I started by purposefully skipping my whole core.
b/ I started by napping every few hours before switching to my current schedule.
c/ Compared to my previous polyphasic sleep schedule I reduced my total sleep time.
d/ Compared to my previous polyphasic sleep schedule I increased my total sleep time.
e/ I don't know"
`;
const qSFLpolyDep_sanity = 'Please answer with either `e` or a combination of `abcd`.';
const qSFLpolyDep_regex = /^e|[a-d]+$/;

const qSFLpolyNDep_message = `
Which of the following scenarios describes your current attempt the best?
a/ Compared to my previous polyphasic sleep schedule I increased my total sleep time. I am doing a reverse gradual adaptation.
b/ Compared to my previous polyphasic sleep schedule I reduced my total sleep time. I am doing a gradual adaptation.
c/ Compared to my previous polyphasic sleep schedule I reduced my total sleep time. I am doing a rhythmic preservation.
`;
const qSFLpolyNDep_sanity = 'Please answer with `a` or `b` or `c`.';
const qSFLpolyNDep_regex = /^[a-c]$/;
// --

const qPreviousDay_name = 'previous_day';
const qPreviousDay_message = 'Do you want to log about a previous day? `y` = yes, `n` = no';
const qPreviousDay_sanity = 'Please answer with either `y` or `n`.';
const qPreviousDay_n = 'Please contact a moderator and tell them what information in the previous question was incorrect.';

const qDay_name = 'day';
const qDay_message = 'Which day do you want to log about? Please write out the number.';
const qDay_sanity = 'Please write a valid integer.';
const qDay_n = 'Please pick a day before the default one, {0}. If the day you are intending to log about is later than the day displayed please contact a moderator.';

const qDaySegments_name = 'day segments';
const qDaySegments_message = 'Which cores and naps to you want to log about? If logging about the whole day, simply write X. Otherwise, you can write `C1-3` for your first 3 cores, or `C1 C2` for your first 2 cores. The naps work the same, but with an N instead of a C. Example: `C1-2 N1 N2`';
const qDaySegments_sanity = 'Please answer following the instructions above';
const qDaySegments_regex = /^(X|([CN][1-9](-[1-9])?[ ,])*([CN][1-9](-[1-9])?))$/;

const qAdhere_name = 'adhere';
const qAdhere_message = 'Did you adhere to your scheduled sleep times perfectly? `y` = yes, `n` = no.';
const qAdhere_sanity = 'Please answer with either `y` or `n`.';

const qSleepTimes_name = 'sleep times';
const qSleepTimes_message = `At what times did you sleep since your previously logged session? For example, if your last logged nap was at 07:00-07:20, and you slept at 08:00-09:00, 10:00-10:10 and 15:00-15:20 since then, write out all sleeps (even oversleeps) and separate them with the “,”-sign, like this:
\`08:00-09:00,10:00-10:10,15:00-15:20.\`
Please do not use the AM/PM format.`;
const qSleepTimes_sanity = 'Please write the times according to the following format, hh.mm-hh.mm,hh.mm-hh.mm… or hhmm-hhmm,hhmm-hhmm..';
const qSleepTimes_regex = /^([0-9]{1,2}[.:h]?[0-9]{2}-[0-9]{1,2}[.:h]?[0-9]{2}[,; ]?)+$/;
const rangesSeparators = /[,; ]/;
const rangeSeparators = /-/;
const hourSeparators = /[.:h]/;

const qEstimate_name = "estimate";
const qEstimate_message = `
Write out the letters corresponding to what you experienced since your previous log. For example, ACEG. If you don't write a particular letter it is assumed that the opposite happened.
A = hard to fall asleep
B = neither easy nor hard to fall asleep
C = hard to wake up (woke up groggy with sleep inertia)
D = neither easy nor hard to wake up
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
const qEstimate_sanity = "Please stick to the letters above.";
const qEstimate_regex = /^[A-SX]+$/;
const qEstimate_wrong_input = "Only write X if no other letters match your situation.";

// Letter : [Modifier, Statement, Displayed
const qEstimate_statements = {
  "A": [0, "It was hard to fall asleep.", true],
  "B": [0, "A - middle ground", false],
  "C": [3, "I woke up groggy with sleep inertia.", true],
  "D": [1, "C - middle ground", false],
  "E": [0, "I managed to wake up before the alarm.", true],
  "F": [0, "I remembered a dream.", true],
  "G": [1, "I had issues staying productive between sleeps.", true],
  "H": [2, "I found it hard to focus on simple activities.", true],
  "I": [0, "I experienced large mood swings between sleeps.", true],
  "J": [0, "I generally had a bad mood.", true],
  "K": [0, "I had a bad or irregular appetite.", true],
  "L": [0, "I experienced memory-related issues.", true],
  "M": [2, "I experienced microsleeps outside of my scheduled sleep times.", true],
  "N": [1, "I experienced tiredness bombs.", true],
  "O": [3, "I experienced very rough tiredness bombs.", true],
  "P": [2, "I was semi-conscious but in a dream-like state outside scheduled sleep times.", true],
  "Q": [0, "I deviated from normal sleep hygiene procedures (dark period, fasting, routine before sleep etc).", true],
  "R": [0, "I could not properly accomplish desired activities.", true],
  "S": [1, "I switched to alternate activities to stay awake.", true]
};

// Letter : [Modifier, Statement, Middle Ground
const qEstimate_negations = {
  "A": [0, "It was easy to fall asleep.", "B"],
  "C": [0, "I woke up refreshed without sleep inertia.", "D"],
  "F": [0, "I sadly did not remember any dream."],
  "G": [0, "I did not find it hard staying productive between sleeps."],
  "H": [0, "I found it easy to focus on simple activities."],
  "R": [0, "I properly accomplished desired activities."],
};

const qStayAwake_name = 'stay awake';
const qStayAwake_message = 'How hard was it to stay awake on a scale from 1 to 7, where 1 is really easy and 7 is really hard? Based on your answers so far it has been approximated that your difficulty staying awake was {0}';
const qStayAwake_sanity = 'Only write a number between 1 and 7.';
const qStayAwake_recap = [
  'It was very easy to stay awake',
  'It was easy to stay awake',
  'It was somewhat easy to stay awake',
  'It was moderately difficult to stay awake',
  'It was somewhat hard to stay awake',
  'It was hard to stay awake',
  'It was very hard to stay awake'
];

const qRecap_name = 'recap';
const qRecap_message = `If you have anything else to add please write it here, otherwise write “X”. The current message looks like this:\n`;

const qSleepTracker_name = 'sleep tracker';
const qSleepTracker_message = 'If you have an EEG graph you want to include, please post it now, otherwise write ”X”.';

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
  processLog: function(command, message, args, dry=false) {
    if (command === logCMD) {
      log(message, dry);
      return true;
    }
    return false;
  }
};

async function log(message, dry=false) {
  console.log(`CMD   : ${logCMD.toUpperCase()}`);

  const member = getMember(message);
  if (!member) {
    message.author.send('You must join the Polyphasic Sleeping server if you want to post adaptation logs.').catch(console.warn);
    return true;
  }

  if (currentUsers.includes(message.author.id)) {
    return true;
  }

  let displayName = member.nickname;
  if (!displayName) {
    displayName = message.author.username;
  }


  let { schedule, napchartUrl, currentDay, attempt, dateSet, historicLogged, memberData } = await getMemberData(message, displayName);
  if (!schedule) {
    message.author.send('You must first set a schedule and a napchart before writing a log.').catch(console.warn);
    return true;
  }

  let napchart = await getNapchart(displayName, napchartUrl);
  if (napchart == null || napchart.sleeps === "") {
    message.author.send('Error retrieving napchart data from API, or invalid napchart.').catch(console.warn);
    return true;
  }

  try {
    await message.author.send('In order to generate your adaptation log, the bot needs to have a dozen questions answered. Please answer the following ones.');
  }
  catch (err) {
    console.warn(`WARN\t: Couldn't send message to ${displayName}: ${err}`);
    if (message.channel.name != logsChannelName) {
      message.channel.send(`${message.author}: \`+log\` cannot work if I cannot DM you.`).catch(console.warn);
    }
    return true;
  }
  currentUsers.push(message.author.id);

  let qUserName = {name: qUserName_name, sanity: qUserName_sanity, check: -1};
  if (!await processQUserName(message, qUserName, schedule, napchart, currentDay, dateSet)) {
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
    return true;
  }

  if (!qUserName.check) {
    let qPreviousDay = {name: qPreviousDay_name, sanity: qPreviousDay_sanity, check: -1};
    if (!await processqPreviousDay(message, qPreviousDay)) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }

    let qDay = {name: qDay_name, sanity: qDay_sanity, day: -1};
    if (!await processqDay(message, currentDay, qDay)) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
    currentDay = qDay.day;
  }

  let currentScheduleLogs = await getLogs(true, {userName: displayName, schedule: schedule, attempt: attempt});
  let currentDayLogs = currentScheduleLogs ? currentScheduleLogs.entries.filter(e => e.day === currentDay) : null;

  let qScheduleFirstLog = {};
  if (!currentDayLogs && currentDay == 0) {
    qScheduleFirstLog.agreement = {name: 'sfl: agreement', message: qSFLagreement_message, parse: c => qSFLagreement_regex.test(c) ? "" : qSFLagreement_sanity, answer: ""};
    if (!await processqGeneric(message, qScheduleFirstLog.agreement)) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }

    if (qScheduleFirstLog.agreement.answer === "y") {
      qScheduleFirstLog.monoSleep = {name: 'sfl: mono sleep', message: qSFLmonoSleep_message, parse: c => qSFLmonoSleep_regex.test(c) ? "" : qSFLmonoSleep_sanity, answer: ""};
      if (!await processqGeneric(message, qScheduleFirstLog.monoSleep)) {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
        return true;
      }
      qScheduleFirstLog.experience = {name: 'sfl: experience', message: qSFLexperience_message, parse: c => qSFLexperience_regex.test(c) ? "" : qSFLexperience_sanity, answer: ""};
      if (!await processqGeneric(message, qScheduleFirstLog.experience)) {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
        return true;
      }
      qScheduleFirstLog.previousFeeling = {name: 'sfl: previous feeling', message: qSFLpreviousFeeling_message, parse: c => qSFLpreviousFeeling_regex.test(c) ? "" : qSFLpreviousFeeling_sanity, answer: ""};
      if (!await processqGeneric(message, qScheduleFirstLog.previousFeeling)) {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
        return true;
      }
      qScheduleFirstLog.sleepDep = {name: 'sfl: sleep dep', message: qSFLsleepDep_message, parse: c => qSFLsleepDep_regex.test(c) ? "" : qSFLsleepDep_sanity, answer: ""};
      if (!await processqGeneric(message, qScheduleFirstLog.sleepDep)) {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
        return true;
      }
      qScheduleFirstLog.previousSched = {name: 'sfl: previous sched', message: qSFLpreviousSched_message, parse: c => qSFLpreviousSched_regex.test(c) ? "" : qSFLpreviousSched_sanity, answer: ""};
      if (!await processqGeneric(message, qScheduleFirstLog.previousSched)) {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
        return true;
      }
      if (qScheduleFirstLog.sleepDep.answer === 'y') {
        if (qScheduleFirstLog.previousSched.answer === 'y') {
          qScheduleFirstLog.monoDep = {name: 'sfl: mono dep', message: qSFLmonoDep_message, parse: c => qSFLmonoDep_regex.test(c) ? "" : qSFLmonoDep_sanity, answer: ""};
          if (!await processqGeneric(message, qScheduleFirstLog.monoDep)) {
            currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
            return true;
          }
        }
        else {
          qScheduleFirstLog.polyDep = {name: 'sfl: poly dep', message: qSFLpolyDep_message, parse: c => qSFLpolyDep_regex.test(c) ? "" : qSFLpolyDep_sanity, answer: ""};
          if (!await processqGeneric(message, qScheduleFirstLog.polyDep)) {
            currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
            return true;
          }
        }
      }
      else if (qScheduleFirstLog.previousSched.answer === 'n') {
        qScheduleFirstLog.polyNDep = {name: 'sfl: poly no dep', message: qSFLpolyNDep_message, parse: c => qSFLpolyNDep_regex.test(c) ? "" : qSFLpolyNDep_sanity, answer: ""};
        if (!await processqGeneric(message, qScheduleFirstLog.polyNDep)) {
          currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
          return true;
        }
      }
    }
  }

  let qReasonChange = {name: "Reason schedule change", message: "Why did you choose to change your schedule?", parse: c => "", answer: null};
  if (historicLogged && currentDay === 0 && !currentDayLogs) {
    if (!await processqGeneric(message, qReasonChange)) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
  }

  const napchartSleeps = minutify_sleeps(extract_ranges(napchart.sleeps));

  let qDaySegments = {name: qDaySegments_name, sanity: qDaySegments_sanity, answer: null, rawAnswer: ''};
  if (!await processqDaySegments(message, napchartSleeps, qDaySegments)) {
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
    return true;
  }

  let totalSleepTime = 0;
  qDaySegments.answer.cores.forEach(core => totalSleepTime += napchartSleeps.cores[core].diff);
  qDaySegments.answer.naps.forEach(nap => totalSleepTime += napchartSleeps.naps[nap].diff);

  if (currentDayLogs) {
    if (currentDayLogs.some(el => {
      let daySegments = processSegments(el.daySegments, {cores: [], naps: []}, napchartSleeps, null);
      if (daySegments.cores.some(c => qDaySegments.answer.cores.includes(c)) || daySegments.naps.some(n => qDaySegments.answer.naps.includes(n))) {
        message.author.send(`You've already logged about ${el.daySegments === 'X' ? 'the whole day' : el.daySegments}. Try again from the begining.`);
        return true;
      }
      return false;
    })) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
  }

  let qAdhere = {name: qAdhere_name, sanity: qAdhere_sanity, answer: -1};
  if (!await processqAdhere(message, qAdhere)) {
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
    return true;
  }

  let qSleepTimes = {name: qSleepTimes_name, sanity: qSleepTimes_sanity, naps: 0, oversleepMinutes: 0};
  if (!qAdhere.answer) {
    totalSleepTime = await processqSleepTimes(message, qSleepTimes, napchartSleeps, schedule, qDaySegments.answer);
    if (totalSleepTime === false) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
  }

  let qEstimate = {name: qEstimate_name, sanity: qEstimate_sanity, estimate: -1, rawAnswer: "", moods: ""};
  if (!await processqEstimate(message, qEstimate)) {
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
    return true;
  }

  let qStayAwake = {name: qStayAwake_name, sanity: qStayAwake_sanity, estimate: -1};
  if (!await processqStayAwake(message, qEstimate, qStayAwake)) {
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
    return true;
  }

  //TODO: setcompare
  let qRecap = {name: qRecap_name, answer: ""};
  let qSleepTracker = {name: qSleepTracker_name, answer: "", attachment: null};

  // Formatting log
  let get_recap = async function() {
    let description = String.format(descriptionTemplate, `${Math.floor(totalSleepTime / 60)} hours ${totalSleepTime % 60} minutes`);
    if (qSleepTimes.oversleepMinutes) {
      description += `Time oversleeping: ${Math.floor(qSleepTimes.oversleepMinutes / 60)} hours ${qSleepTimes.oversleepMinutes % 60} minutes\n`;
    }
    if (qSleepTimes.naps) {
      description += `Number of naps: ${qSleepTimes.naps}\n`;
    }
    if (qReasonChange.answer) {
      description += `Reason for switching schedule: ${qReasonChange.answer}\n`;
    }

    let segmentTitle = (qDaySegments.rawAnswer.charAt(0) == 'X' ? 'Whole day' : qDaySegments.rawAnswer);
    let segmentField = `Difficulty staying awake: ${qStayAwake_recap[qStayAwake.estimate - 1]}\n`;
    segmentField += qEstimate.moods ? `\n${qEstimate.moods}\n` : '';

    if (!await processqRecap(message, '```' + description + segmentTitle + '\n' + segmentField, qRecap)) {
      return { description: null, segmentTitle: null, segmentField: null };
    }
    segmentField += qRecap.answer ? `\n${qRecap.answer}\n` : '';

    if (hasRole(member, 'Sleep Tracker')) {
      if (!await processqSleepTracker(message, qSleepTracker)) {
        return { description: null, segmentTitle: null, segmentField: null };
      }
    }
    return { description, segmentTitle, segmentField };
  }

  if (dry) {
    currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
    return true;
  }

  // Sending / editing message in logging channel
  let logsChannel = getChannel(message, logsChannelName);
  if (currentDayLogs && currentDayLogs.length > 0) {
    // Editing message
    let foundLog;
    let logMessages;
    do {
      logMessages = await logsChannel.fetchMessages({limit: 100});
      foundLog = logMessages.filter(msg => msg.embeds.length > 0 && msg.embeds[0].author.name == displayName
        && msg.embeds[0].title == String.format(titleTemplate, schedule, currentDay)).first();
      if (foundLog) {
        currentDayLogs.forEach(currentdayLog => {
          totalSleepTime += currentdayLog.sleepTime;
          qSleepTimes.oversleepMinutes += currentdayLog.oversleepTime ? currentdayLog.oversleepTime : 0;
          qSleepTimes.naps += currentdayLog.napsNumber ? currentdayLog.napsNumber : 0;
        });
        const { description, segmentTitle, segmentField } = await get_recap();
        if (!description) {
          currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
          return true;
        }

        const embed = new Discord.RichEmbed(foundLog.embeds[0])
          .setDescription(description)
          .addField(segmentTitle, segmentField)
          .setTimestamp();

        foundLog.edit(embed);
        if (qSleepTracker.attachment) {
          logsChannel.send(`${displayName} EEG ${schedule} - D${currentDay}: ${qDaySegments.rawAnswer.charAt(0) == 'X' ? '' : qDaySegments.rawAnswer}\n${qSleepTracker.answer}`, qSleepTracker.attachment);
        }
      }
    } while (!foundLog && logMessages.length > 0)
    if (!foundLog) {
      console.error(`Could not find a previous log for ${displayName} day ${currentDay}`);
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
  }
  else {
    // Sending message
    const { description, segmentTitle, segmentField } = await get_recap();
    if (!description) {
      currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
      return true;
    }
    let colorRole = member.roles.filter(r => ['Nap only', 'Everyman', 'Dual Core', 'Tri Core', 'Biphasic', 'Experimental'].includes(r.name)).first();
    const color = colorRole ? colorRole.color : '#ffffff';
    const embed = new Discord.RichEmbed()
      .setColor(color)
      .setTitle(String.format(titleTemplate, schedule, currentDay))
      .setAuthor(displayName, message.author.avatarURL)
      .setDescription(description)
      .setThumbnail(cache_url + napchartUrl.split('/').pop() + '.png')
      .addField(segmentTitle, segmentField)
      .setTimestamp();
    logsChannel.send(embed);
    if (qSleepTracker.attachment) {
      logsChannel.send(`${displayName} EEG ${schedule} - D${currentDay}: ${qDaySegments.rawAnswer.charAt(0) == 'X' ? '' : qDaySegments.rawAnswer}\n${qSleepTracker.answer}`, qSleepTracker.attachment);
    }
  }

  try {
    // Saving the log
    message.author.send(end);
    logInstance = buildLogInstance(displayName, schedule, attempt, qReasonChange.answer, qScheduleFirstLog, currentDay, qDaySegments.rawAnswer,
      qEstimate.rawAnswer, qStayAwake.estimate,
      totalSleepTime, qSleepTimes.oversleepMinutes, qSleepTimes.naps,
      qRecap.answer ? qRecap.answer + qSleepTracker.answer : qSleepTracker.answer, qSleepTracker.attachment ? qSleepTracker.attachment.file : null);

    await saveLogInstance(logInstance, message.author.id);

    // Updating consecutive logging of schedule
    currentScheduleLogs = await getLogs(true, {userName: displayName, schedule: schedule, attempt: attempt});
    let currentScheduleLoggedDays = currentScheduleLogs.entries.map(e => e.day);
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

    memberData.currentScheduleMaxLogged = Math.max(...currentScheduleLoggedDays) + 1;
    memberData.save();

    let userLogs = await getLogs(false, {userName: displayName});
    let totalDailyLogs = userLogs.reduce((acc, logs) => acc + new Set(logs.entries.map(e => e.day)).size, 0);
    processTimeRoles(message, member, memberData.currentScheduleMaxLogged,
      longestSequence(currentScheduleLoggedDays), historicLogged, totalDailyLogs);
  }
  catch (err) {
    console.warn("WARN:\t", "Something went wrong: ", err);
  }
  currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
  return true;
}


// Questions processing
// =============================


async function processQUserName(message, qUserName, schedule, napchart, day, dateSet) {
  let botMessage = await message.author.send(qUserName_message + "\n" +
    "- Schedule: " + schedule + "\n" +
    "- Napchart: " + napchart.url + "\n" +
    "- Day: " + day + "\n" +
    "- Date set: " + dateSet + "\n");

  if (!(collected = await collectFromUser(message.author, botMessage.channel, qUserName,
    collected => (collected.content.toLowerCase() === "y" || collected.content.toLowerCase() === "n") ? "" : qUserName_sanity ))) {
    return false;
  }
  qUserName.check = collected.content.toLowerCase() === "y";
  return true;
}

async function processqPreviousDay(message, qPreviousDay) {
  let botMessage = await message.author.send(qPreviousDay_message);

  if (!(collected = await collectFromUser(message.author, botMessage.channel, qPreviousDay,
    collected => (collected.content.toLowerCase() === "y" || collected.content.toLowerCase() === "n") ? "" : qPreviousDay_sanity ))) {
    return false;
  }
  qPreviousDay.check = collected.content.toLowerCase() === "y";
  if (!qPreviousDay.check) {
    message.author.send(qPreviousDay_n);
    return false;
  }
  return true;
}

async function processqDay(message, currentDay, qDay) {
  let botMessage = await message.author.send(qDay_message);
  while (qDay.day === -1) {
    if (!(collected = await collectFromUser(message.author, botMessage.channel, qDay,
      collected => (/^(0|[1-9]\d*)$/.test(collected.content)) ? "" : qDay_sanity))) {
      return false;
    }
    if (collected.content > currentDay) {
      botMessage = await message.author.send(String.format(qDay_n, currentDay));
    }
    else {
      qDay.day = collected.content;
    }
  }
  return true;
}

async function processqGeneric(message, q) {
  let botMessage = await message.author.send(q.message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, q, collected => q.parse(collected.content)))) {
    return false;
  }
  q.answer = collected.content.toLowerCase();
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

async function processqDaySegments(message, napchartSleeps, qDaySegments) {
  let cores = "Cores:\n";
  let naps = "\nNaps:\n";
  napchartSleeps.cores.forEach((core, i) => {
    let end = core.end > 24*60 ? core.end -24*60 : core.end;
    cores += `\`C${i+1}\`: ${Math.floor(core.begin / 60)}h${formatMinute(core.begin)}-${Math.floor(end / 60)}h${formatMinute(end)}\n`;
  });
  napchartSleeps.naps.forEach((nap, i) => {
    let end = nap.end > 24*60 ? nap.end -24*60 : nap.end;
    naps += `\`N${i+1}\`: ${Math.floor(nap.begin / 60)}h${formatMinute(nap.begin)}-${Math.floor(end / 60)}h${formatMinute(end)}\n`;
  });

  while (!qDaySegments.answer) {
    let botMessage = await message.author.send(qDaySegments_message + "\n" + cores + naps);

    if (!(collected = await collectFromUser(message.author, botMessage.channel, qDaySegments,
      collected => qDaySegments_regex.test(collected.content.toUpperCase()) ? "" : qDaySegments_sanity))) {
      return false;
    }
    qDaySegments.rawAnswer = collected.content.toUpperCase();
    qDaySegments.answer = processSegments(collected.content.toUpperCase(), {cores: [], naps: []}, napchartSleeps, message);
  }
  return true;
}

function processSegments(str, out, napchartSleeps, message) {
  if (str.charAt(0) == 'X') {
    for (i = 0; i < napchartSleeps.cores.length; i++){
      out.cores.push(i);
    }
    for (i = 0; i < napchartSleeps.naps.length; i++){
      out.naps.push(i);
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
      out.cores.push(i);
    }
    else {
      if (end >= napchartSleeps.naps.length) {
        if (message) {
          message.author.send(`You seem to not have a nap #${end + 1} in your schedule!`);
        }
        return false;
      }
      out.naps.push(i);
    }
  }
  return true;
}

async function processqAdhere(message, qAdhere) {
  let botMessage = await message.author.send(qAdhere_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, qAdhere,
    collected => (collected.content.toLowerCase() === "y" || collected.content.toLowerCase() === "n") ? "" : qAdhere_sanity))) {
    return false;
  }
  qAdhere.answer = collected.content.toLowerCase() === "y";
  return true;
}

async function processqSleepTimes(message, qSleepTimes, napchartSleeps, schedule, daySegments) {
  let botMessage = await message.author.send(qSleepTimes_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, qSleepTimes,
    collected => check_ranges(collected.content)))) {
    return false;
  }
  let ranges = extract_ranges(collected.content);
  if (ranges.length / 4 != daySegments.cores.length + daySegments.naps.length) {
    message.author.send(
      `You need to match the number of naps / cores you are logging (${daySegments.cores.length + daySegments.naps.length}) with the times you indicate (${ranges.length / 4}).`);
    return processqSleepTimes(message, qSleepTimes, napchartSleeps, schedule, daySegments);
  }
  let sleeps = minutify_sleeps(ranges);
  if (!sleeps) {
    message.author.send("Detected overlapping or invalid time, please check your times and try again.");
    return processqSleepTimes(message, qSleepTimes, napchartSleeps, schedule, daySegments);
  }
  for (const sleep of sleeps.cores.concat(sleeps.naps)) {
    let bestDiff = 9999;
    for (const chartSleep of napchartSleeps.cores.concat(napchartSleeps.naps)) {
      let diff = sleep.arr.and(chartSleep.arr.not()).cardinality();
      bestDiff = Math.min(diff, bestDiff);
    }

    if (flexibleSchedules.includes(schedule) && sleep.diff <= napMaxLength) {
      qSleepTimes.naps++;
    } else {
      qSleepTimes.oversleepMinutes += Math.min(bestDiff, sleep.diff);
    }
  }
  return sleeps.totalSleepTime;
}

async function processqEstimate(message, qEstimate) {
  let botMessage = await message.author.send(qEstimate_message);
  while (qEstimate.estimate === -1) {
    if (!(collected = await collectFromUser(message.author, botMessage.channel, qEstimate,
      collected => qEstimate_regex.test(collected.content.toUpperCase() ? "" : qEstimate_sanity)))) {
      return false;
    }
    qEstimate.rawAnswer = collected.content.toUpperCase();
    if (qEstimate.rawAnswer.includes("X")) {
      if (qEstimate.rawAnswer.length > 1) {
        botMessage = await message.author.send(qEstimate_wrong_input);
      } else {
        qEstimate.estimate = -99;
      }
    } else {
      qEstimate.estimate = 0;
    }
  }
  for (const [letter, value] of Object.entries(qEstimate_statements)) {
    if (qEstimate.rawAnswer.includes(letter)) {
      if (qEstimate.moods && value[2]) {
        qEstimate.moods += " ";
      }
      qEstimate.estimate += value[0];
      if (value[2]) {
        qEstimate.moods += value[1];
      }
    }
  }
  for (const [letter, value] of Object.entries(qEstimate_negations)) {
    if (!qEstimate.rawAnswer.includes(letter) && !qEstimate.rawAnswer.includes(value[2])) {
      if (qEstimate.moods) {
        qEstimate.moods += " ";
      }
      qEstimate.estimate += value[0];
      qEstimate.moods += value[1];
    }
  }
  qEstimate.estimate = Math.min(1, Math.max(7, Math.floor((qEstimate.estimate + 2) / 2)));
  return true;
}

async function processqStayAwake(message, qEstimate, qStayAwake) {
  let botMessage = await message.author.send(String.format(qStayAwake_message, qEstimate.estimate));
  if (!(collected = await collectFromUser(message.author, botMessage.channel, qStayAwake,
    collected => /^[1-7]$/.test(collected.content) ? "" : qStayAwake_sanity))) {
    return false;
  }
  qStayAwake.estimate = parseInt(collected.content);
  return true;
}

async function processqRecap(message, recap, qRecap) {
  let botMessage = await message.author.send(qRecap_message + "\n" + recap + '```');
  if (!(collected = await collectFromUser(message.author, botMessage.channel, qRecap, collected => ""))) {
    return false;
  }
  qRecap.answer = collected.content.toLowerCase() === "x" ? "" : collected.content;
  return true;
}

async function processqSleepTracker(message, qSleepTracker) {
  let botMessage = await message.author.send(qSleepTracker_message);
  if (!(collected = await collectFromUser(message.author, botMessage.channel, qSleepTracker, collected => ""))) {
    return false;
  }
  qSleepTracker.attachment = collected.attachments.size > 0 ? new Discord.Attachment(collected.attachments.first().url) : null;
  qSleepTracker.answer = collected.content ? "\n" + collected.content : "";
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
    if (sleeps[i] > 24 || sleeps[i + 2] > 24 || sleeps[i + 1] >= 60 || sleeps[i + 3] >= 60) {
      return null;
    }
    if (sleeps[i] === 24) {
      sleeps[i] = 0;
    }
    if (sleeps[i + 2] === 24) {
      sleeps[i + 2] = 0;
    }
    if (sleeps[i + 2] < sleeps[i]) {
      sleeps[i + 2] += 24;
    }
    let range = {
      begin: sleeps[i] * 60 + sleeps[i + 1],
      end: sleeps[i + 2] * 60 + sleeps[i + 3]
    };
    range.diff = range.end - range.begin;
    if (range.diff >= 1440) {
      return null;
    }

    range.arr = new BitSet;
    if (range.end >= 1440) {
      range.arr.setRange(range.begin, 1439);
      range.arr.setRange(0, range.end - 1440);
    }
    else {
      range.arr.setRange(range.begin, range.end);
    }

    const overlap = el => range.begin < el.end && range.begin > el.begin;
    if (range.diff <= 0 || out.naps.some(overlap) || out.cores.some(overlap)) {
      return null;
    }
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
  if (!qSleepTimes_regex.test(ranges))
    return qSleepTimes_sanity;
  ranges.split(rangesSeparators).forEach(range => range.split(rangeSeparators).forEach((time) => {
    if (!hourSeparators.test(time)) {
      let hourIndex = time.length === 3 ? 1 : 2;
      time = time.substr(0, hourIndex) + '-' + time.substr(hourIndex);
    }
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
      let hourIndex = time.length === 3 ? 1 : 2;
      out = out.concat([time.substr(0, hourIndex), time.substr(hourIndex)]);
    }
    else {
      out = out.concat(time.split(hourSeparators));
    }
  }));
  return out.map(x => parseInt(x));
}

function getNapchartPromise(napchartUrl) {
  return new Promise((resolve, reject) => {
    request({url: api_url + 'get?chartid=' + napchartUrl.split('/').pop(), json: true,
      headers: {'User-Agent': 'request'}}, (error, response, body) => {
        if (error) { reject(error); }
        if (response.statusCode != 200) {
          reject('Invalid status code <' + response.statusCode + '>');
        }
        resolve(body);
      });
  });
}

async function getNapchart(username, napchartUrl) {
  let napchart = { url: napchartUrl, sleeps: "" };
  try {
    const data = await getNapchartPromise(napchartUrl);
    data.chartData.elements.forEach(element => {
      if (element.color === 'red' && element.lane === 0) {
        if (napchart.sleeps) {
          napchart.sleeps += ",";
        }
        napchart.sleeps += `${("00" + Math.floor(element.start / 60)).substr(-2)}${("00" + element.start % 60).substr(-2)}-`;
        napchart.sleeps += `${("00" + Math.floor(element.end / 60)).substr(-2)}${("00" + element.end % 60).substr(-2)}`;
      }
    });
    return napchart;
  }
  catch (error) {
    console.error(`ERR\t: Fetching ${username}'s napchart: ${error}`);
    return null;
  }
}

// Helpers
// =======

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


function processTimeRoles(message, member, currentScheduleMaxLogged, maxConsecutive, historicLogged, totalDailyLogs) {
  let oneMonthRole = getGuild(message).roles.find(role => role.name == "1 Month Poly");
  let threeMonthsRole = getGuild(message).roles.find(role => role.name == "3 Months Poly");
  let sixMonthsRole = getGuild(message).roles.find(role => role.name == "6 Months Poly");
  let oneYearRole = getGuild(message).roles.find(role =>  role.name == "1+ Year Poly");
  let loggerRole = getGuild(message).roles.find(role => role.name == "Experienced Logger");
  let masterLoggerRole = getGuild(message).roles.find(role => role.name == "Master Logger");

  if (maxConsecutive > 30 && !member.roles.has(loggerRole.id)) {
    member.addRole(loggerRole).catch(console.error);
  }
  if (maxConsecutive > 30 && totalDailyLogs >= 150 && !member.roles.has(masterLoggerRole.id)) {
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
    let currentDay = Math.floor((today.getTime() - d.getTime()) / (1000 * 3600 * 24)) + (d.getHours() > today.getHours() ? 1 : 0);
    let schedule = res.currentScheduleName;
    let napchartUrl = res.currentScheduleChart;
    let attempt = res.historicSchedules.filter(s => s.name == schedule).length;

    // Retrieves the number of time each schedule was attempted, and fill
    // maxLogged property using that. Ideally should be done by set only
    //if (res.historicSchedules && (res.historicSchedules.map(hs => hs.maxLogged).every(el => el === 0))) {
    //  let schedulesAttempted = res.historicSchedules.map(s => s.name);
    //  for (const scheduleAttempted of schedulesAttempted) {
    //    let scheduleAttempts = res.historicSchedules.filter(s => s.name == scheduleAttempted);
    //    for (i = 0; i < scheduleAttempts.length; i++) {
    //      let scheduleAttemptLogs = await getLogs(true, {userName: displayName, schedule: scheduleAttempted, attempt: i});
    //      scheduleAttempts[i].maxLogged = scheduleAttemptLogs && Math.max(...scheduleAttemptLogs.entries.map(e => e.day));
    //    }
    //  }
    //  res.save();
    //}

    let historicLogged = res.historicSchedules.reduce((acc, sched) => acc + sched.maxLogged, 0);

    return { schedule, napchartUrl, currentDay, attempt, dateSet, historicLogged, memberData: res };
  }
  return { schedule: null, napchart: null, currentDay: null, attempt: null, dateSet: null, historicLogged: null, memberData: null };
}

async function getLogs(first, filter) {
  let res = null;
  try {
    if (first) {
      res = await LogModel.findOne(filter);
    }
    else {
      res = await LogModel.find(filter);
    }
  }
  catch (err) {
    console.warn("WARN  : ", "Could not get log: ", err);
  }
  return res;
}

function buildLogInstance(username, schedule, attempt, reasonChange, qScheduleFirstLog, day, daySegments, moods, awakeDifficulty, sleepTime, oversleepTime, napsNumber, logMessage, attachment) {
  let logInstance = {
    filter: {
      userName: username,
      schedule: schedule,
      attempt: attempt
    },
    data: {
      reasonChange: reasonChange
    },
    entries: {
      day: day,
      daySegments: daySegments,
      moods: moods,
      awakeDifficulty: awakeDifficulty,
      sleepTime: sleepTime
    }
  };

  if (oversleepTime) {
    logInstance.entries.oversleepTime = oversleepTime;
  }
  if (napsNumber) {
    logInstance.entries.napsNumber = napsNumber;
  }
  if (attachment) {
    logInstance.entries.attachment = attachment;
  }
  if (logMessage) {
    logInstance.entries.logMessage = logMessage;
  }
  if (qScheduleFirstLog.agreement && qScheduleFirstLog.agreement.answer === 'y') {
    logInstance.data.monoSleep = qScheduleFirstLog.monoSleep.answer;
    logInstance.data.experience = qScheduleFirstLog.experience.answer;
    logInstance.data.previousFeeling = qScheduleFirstLog.previousFeeling.answer;
    logInstance.data.sleepDep = qScheduleFirstLog.sleepDep.answer;
    logInstance.data.previousSched = qScheduleFirstLog.previousSched.answer;
  }
  if (qScheduleFirstLog.monoDep) {
    logInstance.data.monoDep = qScheduleFirstLog.monoDep.answer;
  }
  if (qScheduleFirstLog.polyDep) {
    logInstance.data.polyDep = qScheduleFirstLog.polyDep.answer;
  }
  if (qScheduleFirstLog.polyNDep) {
    logInstance.data.polyNDep = qScheduleFirstLog.polyNDep.answer;
  }
  return logInstance;
}

async function saveLogInstance(logInstance, userId) {
  await LogModel.updateOne(logInstance.filter,
    { ...logInstance.filter, ...logInstance.data, $push: { entries: { ...logInstance.entries } } },
    { upsert: true });
  return true;
}

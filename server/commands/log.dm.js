const BitSet = require('bitset');
const Discord = require('discord.js');
const LogModel = require('../models/log.model');
const UserModel = require('../models/user.model');
require('./log.tools.js')();

const { last } = require('./array.js');
const { getNapchart } = require('./napchart.js');

const logCMD = 'log';
const logsChannelName = 'adaptation_logs';
const flexibleSchedules = ['DUCAMAYL', 'SEVAMAYL', 'SPAMAYL', 'Random'];

const { nc_endpoint } = require('../../config.json');
const cache_url = 'https://cache.polyphasic.net/cdn/';
const napMaxLength = 45;

// Embed limits
const fieldLimit = 1024;
const embedLimit = 6000;

let currentUsers = [];

const qUserName_name = 'user check';
const qUserName_message = `
In charge to generate thy adaptation log, the **bot** needeth to has't a few questions answered.
At any point thee may answer with \`abort\` to abort the process.

The following information was pulled from the database. If it is incorrect, you may contact a moderator.`;

// Schedule First Log
const qSFLagreement_message =
  'Hello! Are you OK with answering a few extra questions since this is your first time logging on this schedule? `y` = yes, `n` = no';
const qSFLagreement_sanity = 'Please answer with either `y` or `n`.';
const qSFLagreement_regex = /^[yYnN]$/;

const qSFLmonoSleep_message =
  "How much sleep do you need when you are sleeping monophasically (in hours)? Typing `?` = I don't know.";
const qSFLmonoSleep_sanity =
  'Please simply answer with a reasonable number of hours, without any other character, or `?`.';
const qSFLmonoSleep_regex = /^\?|1[0-2]|[2-9]$/;

const qSFLexperience_message =
  'Are you an experienced polyphasic sleeper? `y` = yes, `n` = no';
const qSFLexperience_sanity = 'Please answer with either `y` or `n`.';
const qSFLexperience_regex = /^[yYnN]$/;

const qSFLpreviousFeeling_message =
  "How good did you feel on your previous schedule on a scale from 1 to 7? Typing `?` = I don't know";
const qSFLpreviousFeeling_sanity =
  'Please answer with either `?` or a number from 1 to 7.';
const qSFLpreviousFeeling_regex = /^\?|[1-7]$/;

const qSFLsleepDep_message =
  'Are you sleep deprived right now? `y` = yes, `n` = no';
const qSFLsleepDep_sanity = 'Please answer with either `y` or `n`.';
const qSFLsleepDep_regex = /^[yYnN]$/;

const qSFLpreviousSched_message =
  'Was your previous schedule monophasic sleep? `y` = yes, `n` = no';
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
const qSFLmonoDep_sanity =
  'Please answer with either `e` or a combination of `abcd`.';
const qSFLmonoDep_regex = /^e|[a-d]+$/;

const qSFLpolyDep_message = `
Which of the following scenarios describes your current attempt the best?
a/ I started by purposefully skipping my whole core.
b/ I started by napping every few hours before switching to my current schedule.
c/ Compared to my previous polyphasic sleep schedule I reduced my total sleep time.
d/ Compared to my previous polyphasic sleep schedule I increased my total sleep time.
e/ I don't know"
`;
const qSFLpolyDep_sanity =
  'Please answer with either `e` or a combination of `abcd`.';
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

const qDay_name = 'day';
const qDay_message =
  `Which day do you want to log about? Please write out the number.
*A schedule begins from day 0, not 1.*`;
const qDay_sanity = 'Please write a valid integer.';

const qDaySegments_name = 'day segments';
const qDaySegments_message =
  'Which cores and naps to you want to log about? If logging about the whole day, simply write `X`. Otherwise, you can write `C1-3` for your first 3 cores, or `C1 C2` for your first 2 cores. The naps work the same, but with an N instead of a C.\nExample: `C1-2 N1 N2`';
const qDaySegments_sanity = 'Please answer following the instructions above.';
const qDaySegments_regex = /^(X|([CN][1-9](-[1-9])?[ ,])*([CN][1-9](-[1-9])?))$/;

const qAdhere_name = 'adhere';
const qAdhere_message =
  'Did you adhere to your scheduled sleep times perfectly? `y` = aye, `n` = nay';
const qAdhere_sanity = 'Please answer with either `y` or `n`.';

const qSleepTimes_name = 'sleep times';
const qSleepTimes_message = `At what times did you sleep since your previously logged session? For example, if you slept at \`08:00-09:00\`, \`10:00-10:10\` and \`15:00-15:20\`, write out all sleeps (even oversleeps) and separate them with a whitespace, like this:
\`08:00-09:00 10:00-10:10 15:00-15:20\`
Please do not use the AM/PM format.`;
const qSleepTimes_sanity =
  'Please write the times according to the following format, `hh:mm-hh:mm hh:mm-hh:mm`... or `hhmm-hhmm hhmm-hhmm`... (range is 00:00-23:59)';
const qSleepTimes_regex = /^([0-9]{1,2}[.:h]?[0-9]{2}-[0-9]{1,2}[.:h]?[0-9]{2} ?)+$/;
const rangesSeparators = /[ ,;]/;
const rangeSeparators = /-/;
const hourSeparators = /[.:h]/;

const qEstimate_name = 'estimate';
const qEstimate_message = `
Write out the letters corresponding to what you experienced since your previous log. For example, ACEG.
*If you don't write a particular letter it is assumed that the opposite happened.*
**A** = hard to fall asleep
**C** = hard to wake up (woke up groggy with sleep inertia)
**E** = woke up before the alarm
**F** = remembered a dream
**G** = had issues staying productive between sleeps
**H** = found it hard to focus on simple activities (watching TV etc)
**I** = experienced large mood swings between sleeps
**J** = generally bad mood
**K** = had a bad or irregular appetite
**L** = experienced memory-related issues
**M** = experienced microsleeps outside of scheduled sleep times
**N** = experienced tiredness bombs
**O** = experienced very rough tiredness bombs
**P** = was semi-conscious but in a dream-like state outside scheduled sleep times
**Q** = deviated from normal sleep hygiene procedures (dark period, fasting, routine before sleep etc)
**R** = could not properly accomplish desired activities
**S** = switched to alternate activities to stay awake
**T** = feelings of soreness or lingering pain after exercise
**X** = none of the above`;
const qEstimate_sanity = 'Please stick to the letters above.';
const qEstimate_regex = /^[A-SX]+$/;
const qEstimate_wrong_input =
  'Only write `X` if no other letters match your situation.';

// Letter : [Modifier, Statement, Mandatory]
const qEstimate_statements = {
  A: [0, 'Easy to fall asleep', true],
  C: [3, 'Easy to wake up, without sleep inertia', true],
  G: [1, 'Easy to stay productive between sleeps', true],
  H: [2, 'Easy to focus on simple activities', true],
  E: [0, '+ I managed to wake up before the alarm.', false],
  F: [0, '+ I remembered a dream.', false],
  I: [0, '- I experienced large mood swings between sleeps.', false],
  J: [0, '- I generally had a bad mood.', false],
  K: [0, '- I had a bad or irregular appetite.', false],
  L: [0, '- I experienced memory-related issues.', false],
  M: [
    2,
    '- I experienced microsleeps outside of my scheduled sleep times.',
    false,
  ],
  N: [1, '- I experienced tiredness bombs.', false],
  O: [3, '- I experienced very rough tiredness bombs.', false],
  P: [
    2,
    '- I was semi-conscious but in a dream-like state outside scheduled sleep times.',
    false,
  ],
  Q: [
    0,
    '- I deviated from normal sleep hygiene procedures (dark period, fasting, routine before sleep etc).',
    false,
  ],
  R: [0, '- I could not properly accomplish desired activities.', false],
  S: [1, '- I switched to alternate activities to stay awake.', false],
  T: [0, '- I had feelings of soreness or lingering pain after exercising.', false],
};

const qStayAwake_name = 'stay awake';
const qStayAwake_message =
  `How hard was it to stay awake on a scale from 1 to 7, where 1 is really easy and 7 is really hard?
Based on your answers so far it has been approximated that your difficulty staying awake was \`{0}\``;
const qStayAwake_sanity = 'Only write a number between 1 and 7.';
const qStayAwake_recap = [
  'It was very easy to stay awake',
  'It was easy to stay awake',
  'It was somewhat easy to stay awake',
  'It was moderately difficult to stay awake',
  'It was somewhat hard to stay awake',
  'It was hard to stay awake',
  'It was very hard to stay awake',
];

const qCustomInfo_name = 'custom info';
const qCustomInfo_message = 'If you have anything else to add please write it here, otherwise write `X`.';

const end = 'Thank you!';

const titleTemplate = `{0} day {1}`;
const descriptionTemplate = `Total sleep time: {0}\n`;

if (!String.format) {
  String.format = function (format) {
    let args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

module.exports = {
  processLog: function (command, message, args, dry = false) {
    if (command === logCMD) {
        executeLog(message);
        return true;
    }
    return false;
  },
};

async function executeLog(message) {
    if (currentUsers.includes(message.author.id)) {
        return;
    }
    currentUsers.push(message.author.id);
    try {
        await log(message);
    }
    catch (err) {
        await message.author.send(
            `Error while logging, send this to Ninichat:
            ${err}`
        );
        console.error(`ERR\t: ${err}`);
    }
    finally {
        currentUsers.splice(currentUsers.indexOf(message.author.id), 1);
    }
}

async function log(message) {
  console.log(`CMD   : ${logCMD.toUpperCase()}`);

  const member = getMember(message);
  if (!member) {
    message.author
      .send(
        'You must join the Polyphasic Sleeping server if you want to post adaptation logs.'
      )
      .catch(console.warn);
    return true;
  }

  let displayName = member.nickname;
  if (!displayName) {
    displayName = message.author.username;
  }

  let {
    schedule,
    napchartUrl,
    currentDay,
    historicId,
    dateSet,
    historicLogged,
    currentScheduleSleeps,
    logOptions,
    memberData,
  } = await getMemberData(message);
  if (schedule === undefined) {
    message.author
      .send(
        'You must first set a schedule and a napchart before writing a log.'
      )
      .catch(console.warn);
    return true;
  }

  let napchart = { url: napchartUrl, sleeps: currentScheduleSleeps } ;
  if (!napchart.sleeps) {
      napchart = await getNapchart(displayName, napchartUrl);
  }
  if (napchart == null || napchart.sleeps === '') {
    message.author
      .send('Error retrieving napchart data from API, or invalid napchart. Please make sure that sleep is labeled in red and located in the innermost ring of the chart.')
      .catch(console.warn);
    return true;
  }

  if (!await processQUserName(message, schedule, napchart, dateSet)) {
    return true;
  }

  let qDay = { name: qDay_name, sanity: qDay_sanity, day: -1 };
  if (!(await processqDay(message, qDay))) {
    return true;
  }
  currentDay = qDay.day;

  let currentScheduleLogs = await getLogs(true, {
    userId: message.author.id,
    schedule: schedule,
    historicId: historicId,
  });
  let currentDayLogs = (currentScheduleLogs && currentScheduleLogs.entries)
    ? currentScheduleLogs.entries.filter((e) => e.day === currentDay)
    : null;

  let qScheduleFirstLog = {};
  if (!currentScheduleLogs) {
    qScheduleFirstLog.agreement = {
      name: 'sfl: agreement',
      message: qSFLagreement_message,
      parse: (c) => (qSFLagreement_regex.test(c) ? '' : qSFLagreement_sanity),
      answer: '',
    };
    if (!(await processqGeneric(message, qScheduleFirstLog.agreement))) {
      return true;
    }

    if (qScheduleFirstLog.agreement.answer === 'y') {
      qScheduleFirstLog.monoSleep = {
        name: 'sfl: mono sleep',
        message: qSFLmonoSleep_message,
        parse: (c) => (qSFLmonoSleep_regex.test(c) ? '' : qSFLmonoSleep_sanity),
        answer: '',
      };
      if (!(await processqGeneric(message, qScheduleFirstLog.monoSleep))) {
        return true;
      }
      qScheduleFirstLog.experience = {
        name: 'sfl: experience',
        message: qSFLexperience_message,
        parse: (c) =>
          qSFLexperience_regex.test(c) ? '' : qSFLexperience_sanity,
        answer: '',
      };
      if (!(await processqGeneric(message, qScheduleFirstLog.experience))) {
        return true;
      }
      qScheduleFirstLog.previousFeeling = {
        name: 'sfl: previous feeling',
        message: qSFLpreviousFeeling_message,
        parse: (c) =>
          qSFLpreviousFeeling_regex.test(c) ? '' : qSFLpreviousFeeling_sanity,
        answer: '',
      };
      if (
        !(await processqGeneric(message, qScheduleFirstLog.previousFeeling))
      ) {
        return true;
      }
      qScheduleFirstLog.sleepDep = {
        name: 'sfl: sleep dep',
        message: qSFLsleepDep_message,
        parse: (c) => (qSFLsleepDep_regex.test(c) ? '' : qSFLsleepDep_sanity),
        answer: '',
      };
      if (!(await processqGeneric(message, qScheduleFirstLog.sleepDep))) {
        return true;
      }
      qScheduleFirstLog.previousSched = {
        name: 'sfl: previous sched',
        message: qSFLpreviousSched_message,
        parse: (c) =>
          qSFLpreviousSched_regex.test(c) ? '' : qSFLpreviousSched_sanity,
        answer: '',
      };
      if (!(await processqGeneric(message, qScheduleFirstLog.previousSched))) {
        return true;
      }
      if (qScheduleFirstLog.sleepDep.answer === 'y') {
        if (qScheduleFirstLog.previousSched.answer === 'y') {
          qScheduleFirstLog.monoDep = {
            name: 'sfl: mono dep',
            message: qSFLmonoDep_message,
            parse: (c) => (qSFLmonoDep_regex.test(c) ? '' : qSFLmonoDep_sanity),
            answer: '',
          };
          if (!(await processqGeneric(message, qScheduleFirstLog.monoDep))) {
            return true;
          }
        } else {
          qScheduleFirstLog.polyDep = {
            name: 'sfl: poly dep',
            message: qSFLpolyDep_message,
            parse: (c) => (qSFLpolyDep_regex.test(c) ? '' : qSFLpolyDep_sanity),
            answer: '',
          };
          if (!(await processqGeneric(message, qScheduleFirstLog.polyDep))) {
            return true;
          }
        }
      } else if (qScheduleFirstLog.previousSched.answer === 'n') {
        qScheduleFirstLog.polyNDep = {
          name: 'sfl: poly no dep',
          message: qSFLpolyNDep_message,
          parse: (c) => (qSFLpolyNDep_regex.test(c) ? '' : qSFLpolyNDep_sanity),
          answer: '',
        };
        if (!(await processqGeneric(message, qScheduleFirstLog.polyNDep))) {
          return true;
        }
      }
    }
  }

  let qReasonChange = {
    name: 'Reason schedule change',
    message:
      'Why did you choose to change your schedule? Answer with `x` if you do not wish to answer.',
    parse: (c) => '',
    answer: null,
  };
  if (historicLogged && !currentScheduleLogs) {
    if (!(await processqGeneric(message, qReasonChange))) {
      return true;
    }
  }

  const napchartSleeps = minutify_sleeps(extract_ranges(napchart.sleeps));

  let qDaySegments = {
    name: qDaySegments_name,
    sanity: qDaySegments_sanity,
    answer: null,
    rawAnswer: '',
  };
  if (!(await processqDaySegments(message, napchartSleeps, qDaySegments, logOptions))) {
    return true;
  }

  let totalSleepTime = 0;
  qDaySegments.answer.cores.forEach(
    (core) => (totalSleepTime += napchartSleeps.cores[core].diff)
  );
  qDaySegments.answer.naps.forEach(
    (nap) => (totalSleepTime += napchartSleeps.naps[nap].diff)
  );

  if (currentDayLogs) {
    if (
      currentDayLogs.some((el) => {
        let daySegments = processSegments(
          el.daySegments,
          napchartSleeps
        );
        if (!daySegments) {
          console.warn(
            `ERR\t: Irregular day segments found: ${el.daySegments} for schedule cores: ${napchartSleeps.cores.length}, naps: ${napchartSleeps.naps.length}`
          );
          return true;
        }
        if (
          daySegments.cores.some((c) =>
            qDaySegments.answer.cores.includes(c)
          ) ||
          daySegments.naps.some((n) => qDaySegments.answer.naps.includes(n))
        ) {
          message.author.send(
            `You've already logged about ${
              el.daySegments === 'X' ? 'the whole day' : el.daySegments
            }. Try again from the begining.`
          );
          return true;
        }
        return false;
      })
    ) {
      return true;
    }
  }

  let qAdhere = { name: qAdhere_name, sanity: qAdhere_sanity, answer: -1 };
  if (!(await processqAdhere(message, qAdhere))) {
    return true;
  }

  let qSleepTimes = {
    name: qSleepTimes_name,
    sanity: qSleepTimes_sanity,
    naps: 0,
    oversleepMinutes: 0,
    answer: null,
  };
  if (!qAdhere.answer) {
    totalSleepTime = await processqSleepTimes(
      message,
      qSleepTimes,
      napchartSleeps,
      schedule,
      qDaySegments.answer
    );
    if (totalSleepTime === false) {
      return true;
    }
  }

  let qEstimate = {
    name: qEstimate_name,
    sanity: qEstimate_sanity,
    estimate: -1,
    rawAnswer: '',
    moods: '',
  };
  if (!(await processqEstimate(message, qEstimate))) {
    return true;
  }

  let qStayAwake = {
    name: qStayAwake_name,
    sanity: qStayAwake_sanity,
    estimate: -1,
  };
  if (!(await processqStayAwake(message, qEstimate, qStayAwake))) {
    return true;
  }

  //TODO: setcompare
  let qCustomInfo = { name: qCustomInfo_name, answer: '' };
  let qSleepTracker = {
    name: 'sleep tracker',
    answer: '',
    attachment: null,
  };

  // Formatting log
  let get_recap = async function () {
    let description = String.format(
      descriptionTemplate,
      `${Math.floor(totalSleepTime / 60)} hours ${
        totalSleepTime % 60 === 0
          ? ''
          : Math.floor(totalSleepTime % 60) + 'minutes'
      }`
    );
    if (qSleepTimes.oversleepMinutes) {
      description += `Time oversleeping: ${Math.floor(
        qSleepTimes.oversleepMinutes / 60
      )} hours ${
        qSleepTimes.oversleepMinutes % 60 === 0
          ? ''
          : Math.floor(qSleepTimes.oversleepMinutes % 60) + 'minutes'
      }\n`;
    }
    if (qSleepTimes.naps) {
      description += `Number of naps: ${qSleepTimes.naps}\n`;
    }
    if (qReasonChange.answer && qReasonChange.answer.toLowerCase() !== 'x') {
      description += `Reason for switching schedule: ${qReasonChange.answer}\n`;
    }
    description += `Difficulty staying awake: ${
      qStayAwake_recap[qStayAwake.estimate - 1]
    }\n\n`;
    description += qEstimate.moods;

    let segments = [];
    let segment = { title: '', field: '' };

    //TODO: rewrite this crap
    if (logOptions.enableSegmentField) {
      if (!qSleepTimes.answer) {
        for (const type of [
          ['Core', qDaySegments.answer.cores, napchartSleeps.cores],
          ['Nap', qDaySegments.answer.naps, napchartSleeps.naps],
        ]) {
          for (let c = 0; c < type[1].length; c++) {
            for (const gap of ['', ' Gap']) {
              if ((!logOptions.enableSegmentFieldGap || type[0] === 'Nap') && gap) {
                continue;
              }
              segment.title = `${type[0]} ${type[1][c] + 1} (${displayTime(
                type[2][type[1][c]].begin,
                ':'
              )}-${displayTime(type[2][c].end, ':')})${gap}`;
              let qCustomField = {
                name: 'custom field message',
                message: `Write what happened during your ${type[0]} #${
                  type[1][c] + 1
                }${gap}, or \`x\`.`,
                parse: (c) => '',
                answer: null,
              };
              if (!(await processqGeneric(message, qCustomField))) {
                return {};
              }
              let splitField = Discord.Util.splitMessage(
                  qCustomField.answer,
                  { maxLength: fieldLimit }
              );
              if (typeof splitField === 'string') {
                segment.field = splitField;
                if (segment.field.toLowerCase() !== 'x')
                  segments.push(Object.assign({}, segment));
              }
              else {
                for (let i = 0; i < splitField.length; i++) {
                  segments.push({
                    title: segment.title + `[${i+1}/${splitField.length}]`,
                    field: rest[i]
                  });
                }
              }
            }
          }
        }
      } else {
        for (const type of [
          ['Core', qSleepTimes.answer.cores],
          ['Nap', qSleepTimes.answer.naps],
        ]) {
          for (c = 0; c < type[1].length; c++) {
            for (const gap of ['', ' Gap']) {
              if ((!logOptions.enableSegmentFieldGap || type[0] === 'Nap') && gap) {
                continue;
              }
              let sleep = type[1][c];
              if (
                sleep.correspondingChartSleep.begin === sleep.begin &&
                sleep.correspondingChartSleep.end === sleep.end
              ) {
                segment.title = segment.title = `${type[0]} (${displayTime(
                  sleep.begin,
                  ':'
                )}-${displayTime(sleep.end, ':')})${gap}`;
              } else {
                segment.title =
                  `${type[0]} (schedule: ${displayTime(
                    sleep.correspondingChartSleep.begin,
                    ':'
                  )}-${displayTime(sleep.correspondingChartSleep.end, ':')}, ` +
                  `reality: ${displayTime(sleep.begin, ':')}-${displayTime(
                    sleep.end,
                    ':'
                  )})${gap}`;
              }
              let qCustomField = {
                name: 'custom field message',
                message: `Write what happened during your ${type[0]
                } \`${displayTime(sleep.begin, ':')}-${displayTime(
                  sleep.end,
                  ':'
                )}\`${gap}, or \`x\`.`,
                parse: (c) => '',
                answer: null,
              };
              if (!(await processqGeneric(message, qCustomField))) {
                return {};
              }
              let splitField = Discord.Util.splitMessage(
                  qCustomField.answer,
                  { maxLength: fieldLimit }
              );
              if (typeof splitField === 'string') {
                segment.field = splitField;
                if (segment.field.toLowerCase() !== 'x')
                  segments.push(Object.assign({}, segment));
              }
              else {
                for (let i = 0; i < splitField.length; i++) {
                  segments.push({
                    title: segment.title + `[${i+1}/${splitField.length}]`,
                    field: rest[i]
                  });
                }
              }
            }
          }
        }
      }
    }

      segment.title = 'Recap';
      if (!(await processqCustomInfo(message, qCustomInfo))) {
          return {};
      }
      if (qCustomInfo.answer) {
          let splitField = Discord.Util.splitMessage(
              qCustomInfo.answer,
              { maxLength: fieldLimit }
          );
          if (typeof splitField === 'string') {
              segment.field = splitField;
              if (segment.field.toLowerCase() !== 'x')
                  segments.push(segment);
          }
          else {
              for (let i = 0; i < splitField.length; i++) {
                  segments.push({
                      title: segment.title + `[${i+1}/${splitField.length}]`,
                      field: rest[i]
                  });
              }
          }
      }

    if (hasRole(member, 'Sleep Tracker')) {
      if (!(await processqSleepTracker(message, qSleepTracker))) {
        return {};
      }
    }
    return { description, segments };
  // End of get_recap
  };

    let logsChannel = getChannel(message, logsChannelName);
    let foundLog;
    if (currentDayLogs && currentDayLogs.length > 0) {
        // Retrieve message to edit
        let logMessages;
        do {
            logMessages = await logsChannel.fetchMessages({ limit: 100 });
            foundLog = logMessages
                .filter(
                    (msg) =>
                    msg.embeds.length > 0 &&
                    msg.embeds[0].author.name === displayName &&
                    msg.embeds[0].title ==
                    String.format(titleTemplate, schedule, currentDay)
                )
                .first();
        } while (!foundLog && logMessages.length > 0);
        if (!foundLog) {
            message.author.send(`Could not find ${displayName} log day ${currentDay}`);
            return true;
        }
        currentDayLogs.forEach((currentdayLog) => {
            totalSleepTime += currentdayLog.sleepTime;
            qSleepTimes.oversleepMinutes += currentdayLog.oversleepTime;
            qSleepTimes.naps += currentdayLog.napsNumber;
        });
    }
    // Send message
    const { description, segments } = await get_recap();
    if (!description) {
        return true;
    }
    let colorRole = member.roles
        .filter((r) =>
            [
                'Nap only',
                'Everyman',
                'Dual Core',
                'Tri Core',
                'Biphasic',
                'Experimental',
            ].includes(r.name)
        ).first();
    const color = colorRole ? colorRole.color : '#ffffff';

    let embed;
    if (foundLog) {
        embed = new Discord.RichEmbed(foundLog.embeds[0])
            .setDescription(description)
            .setTimestamp();
    }
    else {
        embed = new Discord.RichEmbed()
            .setColor(color)
            .setTitle(String.format(titleTemplate, schedule, currentDay))
            .setAuthor(displayName, message.author.avatarURL)
            .setDescription(description)
            .setFooter(`ID: ${member.id}`)
            .setTimestamp()
            .setThumbnail(cache_url + napchartUrl.split('/').pop() + '.png');
    }
    let baseEmbed = new Discord.RichEmbed(embed.toJSON())
        .setDescription('')
        .toJSON();

    let embeds = [ embed ];
    let e = 0;
    segments.forEach((segment) => {
        if (segment.field.length + segment.title.length + embeds[e].length >= embedLimit) {
            e++;
            embeds[e] = new Discord.RichEmbed(baseEmbed);
        }
        embeds[e].addField(segment.title, segment.field)
    });

    embeds.forEach(async e => await message.author.send(e));
    let qConfirm = {
        name: 'log: confirm sending',
        message:
        'A preview of what the bot is going to send can be seen below. Write `y` to send your log, or `n` to abort.',
        parse: (c) => (qSFLagreement_regex.test(c) ? '' : qSFLagreement_sanity),
        answer: '',
    };
    if (!(await processqGeneric(message, qConfirm))) {
        return true;
    }
    if (qConfirm.answer.toLowerCase() === 'n') {
        message.author.send('Aborted.');
        return true;
    }

    if (foundLog) {
        await foundLog.edit(embeds.shift(1));
    }
    embeds.forEach(async e => await logsChannel.send(e));
    if (qSleepTracker.attachment) {
        logsChannel.send(
            `${message.author} EEG ${schedule} - D${currentDay}: ${
                qDaySegments.rawAnswer.charAt(0) == 'X' ? '' : qDaySegments.rawAnswer
            }\n${qSleepTracker.answer}`,
            qSleepTracker.attachment
        );
    }

  try {
    // Saving the log
    message.author.send(end);
    logInstance = buildLogInstance(
      message.author.id,
      schedule,
      historicId,
      qReasonChange.answer,
      qScheduleFirstLog,
      currentDay,
      qDaySegments.rawAnswer,
      qEstimate.rawAnswer,
      qStayAwake.estimate,
      totalSleepTime,
      qSleepTimes.oversleepMinutes,
      qSleepTimes.naps,
      segments,
      qCustomInfo.answer
        ? qCustomInfo.answer + qSleepTracker.answer
        : qSleepTracker.answer,
      qSleepTracker.attachment ? qSleepTracker.attachment.file : null
    );

    await saveLogInstance(logInstance);

    // Updating consecutive logging of schedule
    currentScheduleLogs = await getLogs(true, {
      userId: message.author.id,
      schedule: schedule,
      historicId: historicId,
    });
    let currentScheduleLoggedDays = currentScheduleLogs.entries.map(
      (e) => e.day
    );
    const longestSequence = (arr) => {
      const numbers = new Set(arr),
        counts = {};
      var max = 0;
      for (const num of numbers.values()) {
        let next = num + 1;
        numbers.delete(num);
        while (numbers.has(next)) {
          numbers.delete(next++);
        }
        if (counts[next]) {
          next += counts[next];
        }
        max = Math.max((counts[num] = next - num), max);
      }
      return max;
    };

    last(memberData.historicSchedules).maxLogged =
      Math.max(...currentScheduleLoggedDays) + 1;
    if (!currentScheduleSleeps) {
        memberData.currentScheduleSleeps = napchart.sleeps;
    }
    memberData.save();

    let userLogs = await getLogs(false, { userId: message.author.id });
    let totalDailyLogs = userLogs.reduce(
      (acc, logs) => acc + new Set(logs.entries.map((e) => e.day)).size,
      0
    );
    processTimeRoles(
      message,
      member,
      last(memberData.historicSchedules).maxLogged,
      longestSequence(currentScheduleLoggedDays),
      historicLogged,
      totalDailyLogs
    );
  } catch (err) {
    console.warn('WARN:\t', 'Something went wrong: ', err);
  }
  return true;
}

// Questions processing
// =============================

async function processQUserName(message, schedule, napchart, dateSet) {
  let botMessage = await message.author.send(
    `${qUserName_message}
- **Schedule:** ${schedule}
- **Napchart:** ${napchart.url}
- **Date set:**  ${dateSet}
    `
  ).catch((err) => {
    console.log(`INFO\t: Couldn't send message to ${message.author}: ${err}`);
    if (message.channel.name !== logsChannelName) {
      message.channel
        .send(`${message.author}: \`+log\` cannot work if I cannot DM you.`)
        .catch(console.warn);
    }
    return false;
  });
  return true;
}

async function processqPreviousDay(message, qPreviousDay) {
  let botMessage = await message.author.send(qPreviousDay_message);

  if (
    !(collected = await collectFromUser(
      message.author,
      botMessage.channel,
      qPreviousDay,
      (collected) =>
        collected.content.toLowerCase() === 'y' ||
        collected.content.toLowerCase() === 'n'
          ? ''
          : qPreviousDay_sanity
    ))
  ) {
    return false;
  }
  qPreviousDay.check = collected.content.toLowerCase() === 'y';
  if (!qPreviousDay.check) {
    message.author.send(qPreviousDay_n);
    return false;
  }
  return true;
}

async function processqDay(message, qDay) {
  let botMessage = await message.author.send(qDay_message);
  while (qDay.day === -1) {
    if (
      !(collected = await collectFromUser(
        message.author,
        botMessage.channel,
        qDay,
        (collected) =>
          /^(0|[1-9]\d*)$/.test(collected.content) ? '' : qDay_sanity
      ))
    ) {
      return false;
    }
    qDay.day = Number(collected.content);
  }
  return true;
}

/**
 * Format a time as a string.
 *
 * @param  [Int] time Time in minutes.
 *
 * @return [String]   Time as hhhmm.
*/
function formatTime(time) {
    let out = `${Math.floor(time / 60)}h`;
    if (time % 60 === 0) {
        return out + '00';
    }
    if (time % 60 < 10) {
        return out + '0' + (time % 60);
    }
    return out + time % 60;
}

/**
 * Format a range as a string.
 *
 * @param [Int] begin Start of range in minutes.
 * @param [Int] end   End of range in minutes.
 *
 * @return [String] Range formatted as hhhmm-hhhmm.
*/
function formatRange(begin, end) {
    return formatTime(begin) + '-' + formatTime(end);
}

/**
 * Ask the user what segments they want to log about.
 *
 * If logOptions.enableSegments is set to false, consider the whole day.
 *
 * @param [Message] message        Discord message to contact the user.
 * @param [Object]  napchartSleeps Object containing the cores and naps ranges
 *                                 of a schedule.
 * @param [Object]  qDaySegments   Object containing details about the question
 *                                 and answer to contain the answer.
 * @param [Object]  logOptions     Contains options to customize +log
 *
 * @return [Bool] Return whether an answer was obtained.
*/
async function processqDaySegments(message, napchartSleeps, qDaySegments, logOptions) {
    let askSegments = {
        cores: '**Cores:**\n',
        naps: '**Naps:**\n'
    };
    for (const sType of ['cores', 'naps']) {
        napchartSleeps[sType].forEach((segment, i) => {
            let end = segment.end % (24 * 60);
            askSegments[sType] += `\`${sType.charAt(0) + (i + 1)}\`: `
                + `${formatRange(segment.begin, end)}\n`;
        });
    }
    if (!logOptions.enableSegment) {
        qDaySegments.rawAnswer = 'X';
        qDaySegments.answer = processSegments('X', napchartSleeps);
    }
    while (!qDaySegments.answer) {
        let botMessage = await message.author.send(
            qDaySegments_message + '\n' + askSegments.cores + askSegments.naps
        );
        if (!
            (collected = await collectFromUser(
                message.author,
                botMessage.channel,
                qDaySegments,
                (collected) =>
                qDaySegments_regex.test(collected.content.toUpperCase())
                ? ''
                : qDaySegments_sanity
            ))
        ) {
            return false;
        }
        qDaySegments.rawAnswer = collected.content.toUpperCase();
        qDaySegments.answer = processSegments(
            collected.content.toUpperCase(),
            napchartSleeps,
            message
        );
    }
    return true;
}

/**
 * Return object with cores and naps.
 *
 * Using user input, fill the arrays out.cores and out.naps with an appropriate
 * number of elements.
 *
 * @param [String]  str            User input ('x' or cx-x nx-x nx cx...)
 * @param [Object]  napchartSleeps Object containing the cores and naps ranges
 *                                 of a schedule
 * @param [Message] message {null} Discord message, used to send message to user
 *
 * @return [Object] Return object containing arrays cores and naps
*/
function processSegments(str, napchartSleeps, message = null)
{
  let out = { cores: [], naps: [] };
  if (str.charAt(0) === 'X') {
    for (i = 0; i < napchartSleeps.cores.length; i++) {
      out.cores.push(i);
    }
    for (i = 0; i < napchartSleeps.naps.length; i++) {
      out.naps.push(i);
    }
  } else {
    let segments = str.split(/[, ]/);
    for (const segment of segments) {
      if (!(done = processSegment(message, napchartSleeps, segment, out))) {
        return null;
      }
    }
  }
  return out;
}

/**
 * Process a single segment, filling *out* accordingly.
 *
 * @param [Message] message        Discord message used to contact user.
 * @param [Object]  napchartSleeps Object containing the cores and naps ranges
 *                                 of a schedule.
 * @param [String]  segment        A day segment, can be Cx, Nx, Cx-x, Nx-x.
 * @param [Object]  out            An object to fills its cores and naps with.
 *
 * @return [Bool] Return true if successful, false otherwise.
*/
function processSegment(message, napchartSleeps, segment, out) {
    let begin = parseInt(segment.charAt(1)) - 1;
    let end = segment.length > 3 ?
        parseInt(segment.substring(3)) - 1 : begin;
    for (i = begin; i <= end; i++) {
        let target = segment.charAt(0) === 'C' ? 'cores' : 'naps';
        if (end >= napchartSleeps[target].length) {
            if (message) {
                message.author.send(
                    `You seem to not have a ${target} #${end + 1} in your schedule!`
                );
            }
            return false;
        }
        out[target].push(i);
    }
    return true;
}

async function processqAdhere(message, qAdhere) {
  let botMessage = await message.author.send(qAdhere_message);
  if (
    !(collected = await collectFromUser(
      message.author,
      botMessage.channel,
      qAdhere,
      (collected) =>
        collected.content.toLowerCase() === 'y' ||
        collected.content.toLowerCase() === 'n'
          ? ''
          : qAdhere_sanity
    ))
  ) {
    return false;
  }
  qAdhere.answer = collected.content.toLowerCase() === 'y';
  return true;
}

async function processqSleepTimes(
  message,
  qSleepTimes,
  napchartSleeps,
  schedule,
  daySegments
) {
  let botMessage = await message.author.send(qSleepTimes_message);
  if (
    !(collected = await collectFromUser(
      message.author,
      botMessage.channel,
      qSleepTimes,
      (collected) => check_ranges(collected.content)
    ))
  ) {
    return false;
  }
  let ranges = extract_ranges(collected.content);
  if (ranges.length / 4 != daySegments.cores.length + daySegments.naps.length) {
    message.author.send(
      `You need to match the number of naps / cores you are logging (${
        daySegments.cores.length + daySegments.naps.length
      }) with the times you indicate (${ranges.length / 4}).`
    );
    return processqSleepTimes(
      message,
      qSleepTimes,
      napchartSleeps,
      schedule,
      daySegments
    );
  }
  let sleeps = minutify_sleeps(ranges);
  if (!sleeps) {
    message.author.send(
      'Detected overlapping or invalid time, please check your times and try again.'
    );
    return processqSleepTimes(
      message,
      qSleepTimes,
      napchartSleeps,
      schedule,
      daySegments
    );
  }

  for (i = 0; i < sleeps.cores.length + sleeps.naps.length; i++) {
    let sleep =
      i < sleeps.cores.length
        ? sleeps.cores[i]
        : sleeps.naps[i - sleeps.cores.length];
    let bestDiff = 9999;
    for (const chartSleep of napchartSleeps.cores.concat(napchartSleeps.naps)) {
      let diff = sleep.arr.and(chartSleep.arr.not()).cardinality();
      if (diff < bestDiff) {
        bestDiff = diff;
        sleep.correspondingChartSleep = chartSleep;
      }
    }

    if (flexibleSchedules.includes(schedule) && sleep.diff <= napMaxLength) {
      qSleepTimes.naps++;
    } else {
      qSleepTimes.oversleepMinutes += Math.min(bestDiff, sleep.diff);
    }
  }
  qSleepTimes.answer = sleeps;
  return sleeps.totalSleepTime;
}

async function processqEstimate(message, qEstimate) {
  let botMessage = await message.author.send(qEstimate_message);
  while (qEstimate.estimate === -1) {
    if (
      !(collected = await collectFromUser(
        message.author,
        botMessage.channel,
        qEstimate,
        (collected) =>
          qEstimate_regex.test(
            collected.content.toUpperCase() ? '' : qEstimate_sanity
          )
      ))
    ) {
      return false;
    }
    qEstimate.rawAnswer = collected.content.toUpperCase();
    if (qEstimate.rawAnswer.includes('X')) {
      if (qEstimate.rawAnswer.length > 1) {
        botMessage = await message.author.send(qEstimate_wrong_input);
      } else {
        qEstimate.estimate = -99;
      }
    } else {
      qEstimate.estimate = 0;
    }
  }
  for (const [letter, value] of Object.entries(qEstimate_statements).filter(
    (el) => el[1][2]
  )) {
    if (qEstimate.rawAnswer.includes(letter)) {
      qEstimate.estimate += value[0];
      qEstimate.moods += ':x: ';
    } else {
      qEstimate.moods += ':white_check_mark: ';
    }
    qEstimate.moods += value[1] + '\n';
  }
  let diffMoods = '```diff';
  for (const [letter, value] of Object.entries(qEstimate_statements).filter(
    (el) => !el[1][2]
  )) {
    if (qEstimate.rawAnswer.includes(letter)) {
      qEstimate.estimate += value[0];
      diffMoods += '\n';
      diffMoods += value[1];
    }
  }
  if (diffMoods !== '```diff') {
    qEstimate.moods += diffMoods + '```\n';
  }
  qEstimate.estimate = Math.max(
    1,
    Math.min(7, Math.floor((qEstimate.estimate + 2) / 2))
  );
  return true;
}

async function processqStayAwake(message, qEstimate, qStayAwake) {
  let botMessage = await message.author.send(
    String.format(qStayAwake_message, qEstimate.estimate)
  );
  if (
    !(collected = await collectFromUser(
      message.author,
      botMessage.channel,
      qStayAwake,
      (collected) =>
        /^[1-7]$/.test(collected.content) ? '' : qStayAwake_sanity
    ))
  ) {
    return false;
  }
  qStayAwake.estimate = parseInt(collected.content);
  return true;
}

async function processqCustomInfo(message, qCustomInfo) {
  let botMessage = await message.author.send(qCustomInfo_message);
  if (
    !(collected = await collectFromUser(
      message.author,
      botMessage.channel,
      qCustomInfo
    ))
  ) {
    return false;
  }
  qCustomInfo.answer =
    collected.content.toLowerCase() === 'x' ? '' : collected.content;
  return true;
}

/**
 * Insert el into arr, in ascending order.
 *
 * @param {Array} arr   The array, must be sorted in ascending order.
 * @param {Range} el    The element to be added.
 * @param {Int}   start The restart hour, 24h by default.
*/
function insertSort(arr, el, start = 24 * 60) {
    const day = 24 * 60;
    let gt = (a, b) => (a.begin - start + day) % day > (b.begin - start + day) % day;
    let i = arr.length - 1;
    for (; i >= 0 && gt(arr[i], el); i--)
    {
        arr[i + 1] = arr[i];
    }
    arr[i + 1] = el;
}

function minutify_sleeps(sleeps) {
  let out = { cores: [], naps: [], totalSleepTime: 0 };
  if (sleeps.length % 4 != 0) {
    console.error('Sleeps: %o of length of multiple different than 4', sleeps);
    return out;
  }
  for (i = 0; i < sleeps.length; i += 4) {
    if (
      sleeps[i] > 24 ||
      sleeps[i + 2] > 24 ||
      sleeps[i + 1] >= 60 ||
      sleeps[i + 3] >= 60
    ) {
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
      end: sleeps[i + 2] * 60 + sleeps[i + 3],
    };
    range.diff = range.end - range.begin;
    if (range.diff >= 1440) {
      return null;
    }

    range.arr = new BitSet();
    if (range.end >= 1440) {
      range.arr.setRange(range.begin, 1439);
      range.arr.setRange(0, range.end - 1440);
    } else {
      range.arr.setRange(range.begin, range.end);
    }

    const overlap = (el) => range.begin < el.end && range.begin > el.begin;
    if (range.diff <= 0 || out.naps.some(overlap) || out.cores.some(overlap)) {
      return null;
    }
    if (range.diff <= napMaxLength) {
      insertSort(out.naps, range);
    } else {
      insertSort(out.cores, range, 18 * 60);
    }
    out.totalSleepTime += range.diff;
  }
  return out;
}

function check_ranges(ranges) {
  if (!qSleepTimes_regex.test(ranges)) return qSleepTimes_sanity;
  ranges.split(rangesSeparators).forEach((range) =>
    range.split(rangeSeparators).forEach((time) => {
      if (!hourSeparators.test(time)) {
        let hourIndex = time.length === 3 ? 1 : 2;
        time = time.substr(0, hourIndex) + '-' + time.substr(hourIndex);
      }
      time = time.split(hourSeparators);
      if (parseInt(time[0]) > 60)
        return `Hours must be between 0 and 23 (got ${parseInt(time[0])})`;
      if (parseInt(time[1]) > 23)
        return `Minutes must be between 0 and 60 (got ${parseInt(time[1])})`;
    })
  );
  return null;
}

function extract_ranges(ranges) {
  let out = [];
  ranges.split(rangesSeparators).forEach((range) =>
    range.split(rangeSeparators).forEach((time) => {
      if (!hourSeparators.test(time)) {
        let hourIndex = time.length === 3 ? 1 : 2;
        out = out.concat([time.substr(0, hourIndex), time.substr(hourIndex)]);
      } else {
        out = out.concat(time.split(hourSeparators));
      }
    })
  );
  return out.map((x) => parseInt(x));
}

// Helpers
// =======

function displayTime(time, separator) {
  time = time % (24 * 60);
  return (
    ('00' + Math.floor(time / 60)).substr(-2) +
    separator +
    ('00' + Math.floor(time % 60)).substr(-2)
  );
}

function processTimeRoles(
  message,
  member,
  currentScheduleMaxLogged,
  maxConsecutive,
  historicLogged,
  totalDailyLogs
) {
  let oneMonthRole = getGuild(message).roles.find(
    (role) => role.name == '1 Month Poly'
  );
  let threeMonthsRole = getGuild(message).roles.find(
    (role) => role.name == '3 Months Poly'
  );
  let sixMonthsRole = getGuild(message).roles.find(
    (role) => role.name == '6 Months Poly'
  );
  let oneYearRole = getGuild(message).roles.find(
    (role) => role.name == '1+ Year Poly'
  );
  let loggerRole = getGuild(message).roles.find(
    (role) => role.name == 'Experienced Logger'
  );
  let masterLoggerRole = getGuild(message).roles.find(
    (role) => role.name == 'Master Logger'
  );

  if (maxConsecutive > 30 && !member.roles.has(loggerRole.id)) {
    member.addRole(loggerRole).catch(console.error);
  }
  if (
    maxConsecutive > 30 &&
    totalDailyLogs >= 150 &&
    !member.roles.has(masterLoggerRole.id)
  ) {
    member.addRole(loggerRole).catch(console.error);
  }

  if (!member.roles.has(oneYearRole.id)) {
    if (currentScheduleMaxLogged + historicLogged > 365) {
      member.addRole(oneYearRole).catch(console.error);
      if (member.roles.has(sixMonthsRole.id)) { member.removeRole(sixMonthsRole).catch(console.error); }
    } else if (!member.roles.has(sixMonthsRole.id)) {
      if (currentScheduleMaxLogged + historicLogged > 182) {
        member.addRole(sixMonthsRole).catch(console.error);
        if (member.roles.has(threeMonthsRole.id)) { member.removeRole(threeMonthsRole).catch(console.error); }
      } else if (!member.roles.has(threeMonthsRole.id)) {
        if (currentScheduleMaxLogged + historicLogged > 91) {
          member.addRole(threeMonthsRole).catch(console.error);
          if (member.roles.has(oneMonthRole.id)) { member.removeRole(oneMonthRole).catch(console.error); }
        } else if (currentScheduleMaxLogged + historicLogged > 30) {
          if (!member.roles.has(oneMonthRole.id)) { member.addRole(oneMonthRole).catch(console.error); }
        }
      }
    }
  }
}

// DB retrieval / saving
// =======================

async function getMemberData(message) {
  let res;
  try {
    res = await UserModel.findOne({ id: message.author.id });
  } catch (err) {
    console.warn('WARN  : ', 'Could not get user: ', err);
  }

  if (res && res.currentScheduleChart && res.currentScheduleName) {
    let d = new Date(res.updatedAt);
    let today = new Date();

    let dateSet = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let currentDay =
      Math.floor((today.getTime() - d.getTime()) / (1000 * 3600 * 24)) +
      (d.getHours() > today.getHours() ? 1 : 0);
    let schedule = res.currentScheduleName;
    let napchartUrl = res.currentScheduleChart;

    const historicId = last(res.historicSchedules)._id;
    let historicLogged = res.historicSchedules.reduce(
      (acc, sched) => acc + sched.maxLogged,
      0
    );

    return {
      schedule,
      napchartUrl,
      currentDay,
      historicId,
      dateSet,
      historicLogged,
      currentScheduleSleeps: res.currentScheduleSleeps,
      logOptions: res.logOptions,
      memberData: res
    };
  }
  return {};
}

async function getLogs(first, filter) {
  let res = null;
  try {
    if (first) {
      res = await LogModel.findOne(filter);
    } else {
      res = await LogModel.find(filter);
    }
  } catch (err) {
    console.warn('WARN  : ', 'Could not get log: ', err);
  }
  return res;
}

function buildLogInstance(
  userId,
  schedule,
  historicId,
  reasonChange,
  qScheduleFirstLog,
  day,
  daySegments,
  moods,
  awakeDifficulty,
  sleepTime,
  oversleepTime,
  napsNumber,
  segments,
  logMessage,
  attachment
) {
  let logInstance = {
    filter: {
      userId: userId,
      schedule: schedule,
      historicId: historicId,
    },
    data: {},
    entries: {
      day: day,
      daySegments: daySegments,
      moods: moods,
      awakeDifficulty: awakeDifficulty,
      sleepTime: sleepTime,
      segments: segments,
    },
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
  if (reasonChange && reasonChange.toLowerCase() !== 'x') {
    logInstance.data.reasonChange = reasonChange;
  }
  if (
    qScheduleFirstLog.agreement &&
    qScheduleFirstLog.agreement.answer === 'y'
  ) {
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

async function saveLogInstance(logInstance) {
  await LogModel.updateOne(
    logInstance.filter,
    {
      ...logInstance.filter,
      ...logInstance.data,
      $push: { entries: { ...logInstance.entries } },
    },
    { upsert: true }
  );
  return true;
}

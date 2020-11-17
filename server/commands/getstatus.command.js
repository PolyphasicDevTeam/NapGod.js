const UserModel = require('./../models/user.model');
const config = require('../../config.json');
const { findMember } = require('./find');
const request = require('request');
const { executeFunction, dateToStringSimple, minToTZ, bold, h_n_m, tick } = require('./utility');

const api_url = config.nc_endpoint;

let align = arg => { return arg.padEnd('Next sleep'.length + 4, ' ') };

module.exports = {
  processGetTZ: function (command, message, args, dry = false) {
    if (command === 'status') {
      console.log('STATUS', args);
      executeFunction(get, message, args, dry);
      return true;
    }
    return false;
  },
};


async function get(message, args, dry) {
  const memberIdentifier = message.content
    .slice(config.prefix.length + 'status'.length , message.content.length)
    .trim();
  let member;
  if (memberIdentifier === '') {
    member = { value: message.member, found: true };
    console.log(
      `INFO:  user is the author message ${member.value.user.tag} -> ${member.value.id}`
    );
  } else {
    member = findMember(
      memberIdentifier,
      message.guild,
      message.mentions.users
    );
    console.log('INFO:  memberIdentifier: ', memberIdentifier);
    if (!member.found) {
      console.log(member.msg);
      if (!dry) {
        await message.channel.send(member.msg);
      }
      return;
    } else {
      console.log(`INFO:  user found ${member.value.user.tag} -> ${member.value.id}`);
    }
  }
  const userDB = await UserModel.findOne({ id: member.value.user.id });
  if (userDB && userDB.timezone != null) {
    let tzmin = userDB.timezone;
    let schedule = userDB.currentScheduleName;
    let now = new Date(new Date().getTime() + tzmin * 60000)
    let msg = "Status for " + bold(member.value.displayName) + "\n";

    msg += "```"
    msg += "\n" + align("Date:") + dateToStringSimple(now).slice(0,10);
    msg += "\n" + align("Time now:")  + dateToStringSimple(now).slice(11,16);
    if (userDB.currentScheduleChart) {
      let url = userDB.currentScheduleChart;
      let nc = await getNapchart(member.value.user.tag, url);
      let sleeps = nc.sleeps.split(",");
      if(isAsleep(sleeps, now)){
        let nextWake = getNextWake(sleeps, now);
        remaining = (nextWake - now) / 60000;
        msg += "\nThis user is sleeping.";
        msg += "\nWaking in:    " + h_n_m(remaining);
      } else {
        let nextSleep = getNextSleep(sleeps, now);
        remaining = (nextSleep - now) / 60000;
        msg += "\n" + align("Next sleep:") + dateToStringSimple(nextSleep).slice(11,16);
        msg += "\n" + align("In:") + h_n_m(remaining);
      }
      }
      msg += "\n```";
      if (!userDB.currentScheduleChart) {
        if (schedule.includes("Random")) {
        msg += "Eww! This user is on " + bold(schedule) + " schedule!\nNot even Nap God knows when they will sleep next.";
        }
        else if (schedule.includes("MAYL") || schedule.includes("X")) {
        msg += "Wow! This user is on " + bold(schedule) + " schedule!\nNot even Nap God knows when they will sleep next.";
        }
        else {
        msg += "This user has not set a napchart, so Nap God cannot know when they will sleep next.";
        }
      }
      message.channel.send(msg);
  }
  else {
    message.channel.send("Error: User " + bold(member.value.displayName) + " has not set a timezone. You can set a timezone with `+settz [timezone]`")
  }
}


async function getNapchart(username, napchartUrl) {
  let napchart = { url: napchartUrl, sleeps: '' };
  try {
    const data = await getNapchartPromise(napchartUrl);
    data.chartData.elements.forEach((element) => {
      if (element.color === 'red' && element.lane === 0) {
        if (napchart.sleeps) {
          napchart.sleeps += ',';
        }
        napchart.sleeps += `${('00' + Math.floor(element.start / 60)).substr(
          -2
        )}${('00' + (element.start % 60)).substr(-2)}-`;
        napchart.sleeps += `${('00' + Math.floor(element.end / 60)).substr(
          -2
        )}${('00' + (element.end % 60)).substr(-2)}`;
      }
    });
    return napchart;
  } catch (error) {
    console.error(`ERR\t: Fetching ${username}'s napchart: ${error}`);
    return null;
  }
}
function getNapchartPromise(napchartUrl) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: api_url + '/get?chartid=' + napchartUrl.split('/').pop(),
        json: true,
        headers: { 'User-Agent': 'request' },
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        }
        if (response.statusCode != 200) {
          reject('Invalid status code <' + response.statusCode + '>');
        }
        resolve(body);
      }
    );
  });
}

function getNextSleep(sleeps, now){
  let nextSleeps = [];
  sleeps.forEach(sleep => {
    let d = new Date(now);
    d.setHours(sleep.slice(0,2));
    d.setMinutes(sleep.slice(2,4));
    d.setSeconds("0");
    if (d < now){
      d.setDate(d.getDate() + 1)
    }
    nextSleeps.push(d)
  })
  return new Date(Math.min.apply(null,nextSleeps));
}

function getNextWake(sleeps, now){
  let nextWakes = [];
  sleeps.forEach(sleep => {
    let d = new Date(now);
    d.setHours(sleep.slice(5,7));
    d.setMinutes(sleep.slice(7,9));
    d.setSeconds("0");
    if (d < now){
      d.setDate(d.getDate() + 1)
    }
    nextWakes.push(d)
  })
  return new Date(Math.min.apply(null,nextWakes));
}

function isAsleep(sleeps, now){
  let starts = [];
  let ends = [];
  const oneDay = 24 * 60 * 60 * 1000;
  sleeps.forEach(sleep => {
    let d = new Date(now);
    d.setHours(sleep.slice(0,2));
    d.setMinutes(sleep.slice(2,4));
    d.setSeconds("0");
    let thisSleep = new Date(d);
    if (thisSleep > now){
      thisSleep.setDate(thisSleep.getDate() - 1);
    }
    d.setHours(sleep.slice(5,7));
    d.setMinutes(sleep.slice(7,9));
    d.setSeconds("0");
    let thisWake = new Date(d);

    if ((thisWake - thisSleep) > oneDay){
      thisWake.setDate(thisWake.getDate() - 1);
    }
    if (thisSleep > thisWake){
      thisWake.setDate(thisWake.getDate() + 1);
    }

    starts.push(thisSleep);
    ends.push(thisWake);
  });
  for(i=0;i<starts.length;i++){
    if(starts[i] < now && ends[i] > now){
      return true;
    }
  }
  return false;
}

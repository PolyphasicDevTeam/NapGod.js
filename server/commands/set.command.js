const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const schedules = require("./schedules");

const modifiers = [`shortened`, `extended`, `flipped`, `modified`, `recovery`];

module.exports = {
  processSet: function(command, message, args) {
    if (command === "set") {
      if (args.length <= 2 && args.length > 0) {
        set(args, message);

        //const sched = message.content.slice(config.prefix.length).trim().split(/ +/g);
        //if(args[0] ==
      } else {
        message.channel.send(
          "Set what? Say what? You need to provide a URL or a valid sleep cycle see +help for details."
        );
      }
      return true;
    } else {
      return false;
    }
  }
};

async function set(args, message) {
  let msg = "";
  let urlPossible = args.length === 2 ? args[1] : args[0];

  //DONE GET URL, GET User Name
  //TODO HANDLE doubles
  //IF schedule only, wipe chart
  if (args[0] === "none") {
    await saveUserSchedule(message, [""]);
    message.channel.send(
      "Nap Chart has been removed for " + message.author.tag + "."
    );
    return;
  }

  var { is_nurl, nurl } = checkIsUrlAndGet();
  var { is_schedule, schedn, schedfull } = checkIsSchedule(urlPossible);
  if (!is_nurl && !is_schedule) return;

  let userUpdate = buildUserInstance();

  let result = await saveUserSchedule(message, userUpdate);

  if (is_nurl) {
    message.channel.send(
      "Nap Chart set for " + message.author.tag + " to " + nurl.href + "."
    );
  }
  if (is_schedule) {
    message.member.setNickname(
      message.author.username + ` [${args[0].toUpperCase()}]`
    );
    msg = "Schedule set for " + message.author.tag + " to `" + args[0] + "`.";
    message.channel.send(msg);

    let newRole = schedules[schedn.category];
    let role = message.guild.roles.find("name", newRole);
    role && message.member.addRole(role.id);
  }

  if (nurl.host == "napchart.com") {
    // Include http(s) when specifying URLs
    getOrGenImg(nurl, message);
  }

  function buildUserInstance() {
    let userUpdate = {
      tag: message.author.tag,
      userName: message.author.username,
      updatedAt: Date.now()
    };
    if (is_schedule) {
      userUpdate.currentScheduleName = schedfull;
    }
    if (is_nurl) {
      userUpdate.currentScheduleChart = urlPossible;
    }
    return userUpdate;
  }

  function checkIsUrlAndGet(urlPossible) {
    try {
      let nurl = new URL(urlPossible);
      if (nurl.host == "napchart.com") {
        return { is_nurl: true, nurl: nurl };
      }
    } catch (err) {
      // console.log("set image error: " + err);
      return { is_nurl: false };
    }
  }

  function checkIsSchedule(schedulePossible) {
    if (schedulePossible) {
      const schedp_arr = schedulePossible.trim().split(/-+/g);
      const schedn = schedp_arr[0].toLowerCase();
      if (
        schedp_arr.length <= 2 &&
        Object.keys(schedules).includes(schedn) &&
        (schedp_arr.length == 1 ||
          (schedp_arr.length == 2 && modifiers.includes(schedp_arr[1])))
      ) {
        return { is_schedule: true, schedn, schedfull: schedn + schedp_arr[1] };
      } else {
        return { is_schedule: false };
      }
    }
  }

  async function saveUserSchedule(message, userUpdate) {
    let query = { id: message.author.id },
      options = { upsert: true, new: true, setDefaultsOnInsert: true };

    let result = null;
    try {
      result = await UserModel.findOneAndUpdate(query, userUpdate, options);
      saveHistories();
    } catch (error) {
      console.log("error seraching for User: ", error);
      message.channel.send("Something done broke.  Call the fire brigade");
      return;
    }
    return result;

    function saveHistories() {
      if (!result) {
        return;
      }
      result.historicSchedules.push({
        name: userUpdate.currentScheduleName,
        adapted: false
      });
      result.historicScheduleCharts.push({
        url: userUpdate.currentScheduleChart
      });
      result.save();
    }
  }
}

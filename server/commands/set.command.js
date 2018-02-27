const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");

module.exports = {
  processSet: function(command, message, args) {
    if (command === "set") {
      if (args.length == 1) {
        set(args, message);

        //const sched = message.content.slice(config.prefix.length).trim().split(/ +/g);
        //if(args[0] ==
      } else {
        message.channel.send(
          "Set what? Say what? You need to provide a URL or a valid sleep cycle see +help for details."
        );
      }
    }
  }
};

async function set(args, message) {
  let msg = "";
  let is_nurl = false;
  if (args[0] === "none") {
    await saveUserSchedule(message, [""])
    message.channel.send("Nap Chart has been removed for " + message.author.tag + ".");
    
  } else {
    handleUrl();
  }
  if (!is_nurl && args[0]) {
    schedules = {
      e1: "Biphasic",
      segmented: "Biphasic",
      siesta: "Biphasic",
      e2: "Everyman",
      e3: "Everyman",
      e4: "Everyman",
      e5: "Everyman",
      trimaxion: "Everyman",
      bimaxion: "Everyman",
      dc1: "Dual core",
      dc2: "Dual core",
      dc3: "Dual core",
      dc4: "Dual core",
      tc1: "Tri core",
      tc2: "Tri core",
      triphasic: "Tri core",
      mono: "Monophasic",
      sevamayl: "Everyman",
      dymaxion: "Nap only",
      naptation: "Nap only",
      spamayl: "Nap only",
      tesla: "Nap only",
      uberman: "Nap only",
      random: "Random"
    };
    modifiers = [`shortened`, `extended`, `flipped`, `modified`, `recovery`];
    const schedp = args[0].trim().split(/-+/g);
    const schedn = schedp[0].toLowerCase();
    if (
      schedp.length <= 2 &&
      Object.keys(schedules).includes(schedp[0]) &&
      (schedp.length == 1 ||
        (schedp.length == 2 && modifiers.includes(schedp[1])))
    ) {
      message.member.setNickname(
        message.author.username + ` [${args[0].toUpperCase()}]`
      );
      //TODO : Save to DB
      // Setup stuff
      let result = await saveUserSchedule(message, args);

      result &&
        result.historicSchedules.push({
          name: args[0],
          adapted: false
        }) &&
        result.save();

      msg = "Schedule set for " + message.author.tag + " to `" + args[0] + "`.";
      message.channel.send(msg);

      //Update Nickname and role
      let newRole = schedules[schedn];
      let role = message.guild.roles.find("name", newRole);
      role && message.member.addRole(role.id);
    } else {
      message.channel.send(
        "`" + args[0] + "` does not appear to be a valid schedule or url."
      );
    }
  }

  async function saveUserSchedule(message, args){
    let query = { id: message.author.id },
    options = { upsert: true, new: true, setDefaultsOnInsert: true },
    userUpdate = {
      tag: message.author.tag,
      userName: message.author.username,
      currentScheduleName: args[0],
      updatedAt: Date.now()
    };

    let result = null;
      try {
        result = await UserModel.findOneAndUpdate(query, userUpdate, options);
      } catch (error) {
        console.log("error seraching for User: ", error);
        message.channel.send("Something done broke.  Call the fire brigade");
        return;
      }
      return result;
  }

  function handleUrl() {
    try {
      const nurl = new URL(args[0]);
      if (nurl.host == "napchart.com") {
        // Include http(s) when specifying URLs
        getOrGenImg(nurl, message);

        makeNapChartImageUrl(nurl);

        //save to database
        let query = { id: message.author.id },
          options = { upsert: true, new: true, setDefaultsOnInsert: true },
          userUpdate = {
            tag: message.author.tag,
            userName: message.author.username,
            currentScheduleChart: args[0],
            updatedAt: Date.now()
          };

        // Find the document
        UserModel.findOneAndUpdate(query, userUpdate, options, function(
          error,
          result
        ) {
          if (error) {
            console.log("Error updating chart: ", error)
            return;
          }

          result &&
            result.historicScheduleCharts.push({
              url: args[0]
            }) &&
            result.save();

          msg =
            "Nap Chart set for " +
            message.author.tag +
            " to " +
            nurl.href +
            ".";
          message.channel.send(msg);
        });

        is_nurl = true;
      }
    } catch (err) {
      console.log("set image error: " + err);
    }
  }
}

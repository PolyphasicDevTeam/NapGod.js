const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");

module.exports = {
  processSet: function(command, message, args) {
    if (command === "get") {
      if (args.length <= 1) {
        get(args, message);
      } else {
        //What?
        message.channel.send(
          "Valid options are `+get` or `+get userName` or `+get usertag#1234`"
        );
      }
    }
  }
};

async function get(args, message) {
  let msg = "";

  let query = {};
  let searchable = "";
  if (args.length === 1) {
    let isTag = args[0].indexOf("#");
    query[isTag ? "tag" : "userName"] = args[0];
    searchable = args[0];
  } else if (args.length === 0) {
    query.tag = message.author.tag;
    searchable = message.author.tag;
  }

  let res;
  try {
    res = await UserModel.findOne(query);
  } catch (err) {
    console.log("err getting user: ", err);
  }

  if (res.currentScheduleChart) {
    let d = new Date(res.updatedAt);
    var n = d.toLocaleDateString();

    message.channel.send(`Napchart for ${res.tag} (since ${n}:)`);
    getOrGenImg(res.currentScheduleChart, message);
  } else {
    message.channel.send(
      `There is no napchart available for **${searchable}**`
    );
  }
}

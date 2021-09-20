const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapchartImageUrl } = require("./../imageCache");
const schedules = require("./schedules");
const set = require("./set.backend").setInternal;


module.exports = {
  processSet: function(command, message, args, dry=false) {
    if (command === "set") {
      if (args.length <= 2 && args.length > 0) {
	set(args, message, dry);
      } else {
	msg = "Bad input format: Use `+set [schedule-name]` or `+set [napchart-link]`. Use `+set none` to remove your chart without changing schedule.";
	console.log("MSG   : ", msg);
	if(!dry){message.channel.send(msg);}
      }
      return true;
    } else {
      return false;
    }
  }
};

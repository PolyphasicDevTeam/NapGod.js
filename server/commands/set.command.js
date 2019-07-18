const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const schedules = require("./schedules");
const set = require("./set.backend").setInternal;


module.exports = {
  processSet: function(command, message, args, dry=false) {
    if (command === "set") {
      if (args.length <= 2 && args.length > 0) {
	set(args, message, dry);
      } else {
	msg = "You need to provide a URL or a valid sleep cycle see +help for details.";
	console.log("MSG   : ", msg);
	if(!dry){message.channel.send(msg);}
      }
      return true;
    } else {
      return false;
    }
  }
};


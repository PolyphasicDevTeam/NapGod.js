const { URL } = require("url");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const _ = require("lodash");

module.exports = {
	processNc: function(command, message, args, dry=false) {
		if (command === "nc") {
			if (args.length != 1) {
				msg = "Correct usage is `+nc [napchart_url]`."
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
				return true
			}
			console.log("CMD   : NC")
			console.log("ARGS  : ", args)
			let urlPossible = args.length === args[0];
			var { is_nurl, nurl } = checkIsUrlAndGet(urlPossible);
			if (is_nurl) {

				console.log("ACT   : ", "Deleting user input message")
				if(!dry){message.delete().catch(O_o => {});}

				console.log("MSG   : ", "Repriting napchart")
				if (nurl.host == "napchart.com") {
					if(!dry){getOrGenImg(nurl, message);}
				}
			} else {
				msg = "You need to provide valid napchart url."
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			return true
		}
		return false
	}
};


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
	return { is_nurl: false };
}



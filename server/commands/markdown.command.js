const fs = require("fs");
const schedules = require("./schedules").schedules;
const { getOrGenImg } = require("./../imageCache");

let commands = {};

async function bootstrapCommands() {
	let cmds = await fs.readdirSync("./commands");
	cmds.forEach(async function(d) {
		if (!d.endsWith(".md")) return;

		let commandName = d.replace(".md", "").toLowerCase();
		let text = await fs.readFileSync("./commands/" + d, "utf8");
		if (commandName.indexOf(".") >= 0) {
			commandName = commandName.split(".")[0];
			if (!commands.hasOwnProperty(commandName)) {
				commands[commandName] = [];
			}
			commands[commandName].push(text);
		} else {
			commands[commandName] = text;
		}
	});
}

bootstrapCommands();

module.exports = {
	processMarkdownCommands: function(command, message, args, dry=false) {
		if (commands.hasOwnProperty(command)) {
			let mVal = commands[command];
			console.log("MSG   : ", "[Markdown for " + command + "]")
			if (Array.isArray(mVal)) {
				if(!dry){mVal.forEach(m => message.channel.send(m));}
			} else {
				if(!dry){message.channel.send(mVal);}
			}

			if (schedules.hasOwnProperty(command)) {
				schedules[command].chart &&
					getOrGenImg(schedules[command].chart, message, dry);
			}
			return true
		}
		return false
	}
};

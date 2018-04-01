const fs = require("fs");

let commands = {};

async function bootstrapCommands() {
	let cmds = await fs.readdirSync("./commands/help");
	cmds.forEach(async function(d) {
		if (!d.endsWith(".md")) return;

		let commandName = d.replace(".md", "").toLowerCase();
		let text = await fs.readFileSync("./commands/help/" + d, "utf8");
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
			markdown(command, message, args, dry)
			return true
		}
		return false
	}
};

async function markdown(command, message, args, dry=false) {
	let mVal = commands[command];
	console.log("MSG   : ", "[Help markdown for " + command + "]")
	msgparams = {}
	if (Array.isArray(mVal)) {
		if(!dry){mVal.forEach(m => message.channel.send(m, msgparams));}
	} else {
		if(!dry){message.channel.send(mVal,msgparams);}
	}
}

const commands = require("require-all")({
	dirname: __dirname + "/commands",
	filter: /(.+command)\.js$/
});
const flat = require("flat");
const _ = require("lodash");

const commandsFlat = flat(commands);
const c2 = _.values(commandsFlat);

module.exports = {
	processCommands: function(command, message, args) {
		handled = false
		c2.forEach(fn => {handled = handled || fn(command, message, args)});
		if(!handled){
		console.error("ERR>>>: ", "Command was not handled:", command, args)
		}
	}
};

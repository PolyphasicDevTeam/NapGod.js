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
    c2.forEach(fn => fn(command, message, args));
  }
};

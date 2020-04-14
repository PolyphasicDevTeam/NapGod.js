const commands = require("require-all")({
  dirname: __dirname + "/commands",
  filter: /(.+dm)\.js$/
});
const flat = require("flat");
const _ = require("lodash");

const commandsFlat = flat(commands);
const c2 = _.values(commandsFlat);

module.exports = {

  processDMCommands: function(command, message, args, dry=false) {
    handled = false;
    //console.error("INFO  : ", c2)
    c2.forEach(fn => {
      handled = handled || fn(command, message, args, dry);
    });
    if(!handled){
      return false;
    }
    return true;
  }
};

const fs = require("fs");

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
  processMarkdownCommands: function(command,message, args) {
  if (commands.hasOwnProperty(command)) {
      let mVal = commands[command];
      if (Array.isArray(mVal)) {
        mVal.forEach(m => message.channel.send(m));
      } else {
        message.channel.send(mVal);
      }
    }
  }
};

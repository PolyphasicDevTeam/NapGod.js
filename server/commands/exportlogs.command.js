const { URL } = require("url");
const LogModel = require("./../models/log.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const config = require("../../config.json");
const schedules = require("./schedules").schedules;
const fs = require('fs');

const cacheUrl = 'https://cache.polyphasic.net'
const exportLogs = 'exportlogs';

const noPermission = 'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+exportlogs`';

module.exports = {
  processExportLogs: function(command, message, args, dry=false) {
    if (command === exportLogs) {
      exportJson(args, message, dry);
      return true;
    }
    return false;
  }
};

async function exportJson(args, message, dry) {
  let msg = "";
  console.log("CMD   : EXPORT LOGS");
  console.log("ARGS  : ", args);

  const permissions = message.member.roles.some((d) =>
    ['Admins', 'Moderator'].includes(d.name)
  );
  if (!permissions) {
    if (!dry) {
      message.channel.send(noPermission);
    }
  }
  else {
    await sendExport(message.channel, null, "everyone", dry);
  }
}

async function sendExport(channel, filter, displayname, dry) {
  try {
    let res = await LogModel.find(filter);
    let a = await fs.writeFile(
      "/napcharts/export.json",
      JSON.stringify(res),
      async (err) => {
        if (err) {
          if (!dry) {
            await channel.send(err);
          }
          console.log('ERR>>>: ', err);
        } else {
          if (!dry) {
            await channel.send(`Logs are available at ${cacheUrl}/export.json`);
          }
          console.log('MSG   : ', "Logs exported");
        }
      }
    );
  }
  catch (err) {
    console.warn("WARN  : ", "Could not get log: ", err);
  }
}

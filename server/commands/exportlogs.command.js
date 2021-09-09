const LogModel = require("./../models/log.model");
const schedules = require("./schedules").schedules;
const { URL } = require("url");
const { getOrGenImg, makeNapchartImageUrl } = require("./../imageCache");
const { promisify } = require('util');

const writeFileAsync = promisify(require('fs').writeFile);

const { cacheUrl, cachePath } = require("../../config.json");
const exportLogs = 'exportlogs';

const noPermission = 'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+exportlogs`';

module.exports = {
    processExportLogs: function(command, message, args, dry = false) {
        if (command === exportLogs) {
            console.log(`CMD   : ${exportLogs}`);
            exportJson(message);
            return true;
        }
        return false;
    },
};
if (process.env.NODE_ENV === "test") {
    module.exports.exportJson = exportJson;
}

async function exportJson(message) {
    const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
    );
    if (!permissions) {
        await message.channel.send(noPermission);
    }
    else {
        await sendExport(message, null);
    }
}

async function sendExport(message, filter) {
    try {
        let res = await LogModel.find(filter);
        await writeFileAsync(`${cachePath}/export.json`, JSON.stringify(res));
        await message.channel.send(`Logs are available at ${cacheUrl}/export.json`);
        console.log('MSG   :', "Logs exported");
    }
    catch (err) {
        console.warn("WARN  :", "Could not get log: ", err);
        await message.channel.send(err);
    }
}

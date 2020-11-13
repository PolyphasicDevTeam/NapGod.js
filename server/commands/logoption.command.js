const UserModel = require('../models/user.model.js');
const { prefix } = require ('../../config.json');

const argRegex = /^[a-zA-Z]+=[0-1]$/;

const logOptionCMD = 'logoption';

const usage = `\`${prefix + logOptionCMD} option=[0|1]\``;

const options = [
    {
        name: 'enableSegment',
        abbrev: 'es',
        desc: 'when true, enables partial logging, for example logging about one core only'
    },
    {
        name: 'enableSegmentField',
        abbrev: 'esf',
        desc: 'when true, enables writing details about each core / nap'
    },
    {
        name: 'enableSegmentFieldGap',
        abbrev: 'esfg',
        desc: 'when true, enables writing details about each core gap'
    }

];

module.exports = {
  processLogOption: function(command, message, args, dry=false) {
    if (command === logOptionCMD) {
      logOption(message, args);
      return true;
    }
    return false;
  }
};

async function logOption(message, args) {
    console.log(`CMD\t: ${logOptionCMD}`);
    let answer = '';
    let logOptions = [];

    if (!args.length) {
        answer += `Usage: ${usage}\n`;
    }
    else {
        if (argRegex.test(args[0])) {
            logOptions = args[0].split('=');
        }
        else {
            answer += `Bad input format. Use ${usage}\n`;
        }
    }

    answer += await setLogOptions(message, logOptions);
    await message.channel.send(answer).catch();
}

function optEquals(opt, optStr) {
    return opt.name.localeCompare(optStr, undefined, { sensitivity: 'accent' }) === 0
        || opt.abbrev === optStr;
}

async function setLogOptions(message, logOpts) {
    let validOnce = false;
    let res;
    try {
        res = await UserModel.findOne({ id: message.author.id });
    } catch (err) {
        console.warn('WARN  : ', 'Could not get user: ', err);
    }
    if (!res) {
        return 'Error fetching user data from database.';
    }

    for (i = 0; i < logOpts.length; i += 2) {
        if (options.some(o =>
            optEquals(o, logOpts[i]) && (logOpts[i] = o.name))
        ) {
            res.logOptions[logOpts[i]] = logOpts[i + 1] === '1';
            validOnce = true;
        }
    }

    let answer = '';
    if (!validOnce && logOpts.length) {
        answer +=
            'No valid option detected. Please choose one of the options below.\n';
    }
    answer += 'Current options:\n';
    options.forEach(o => answer += `${res.logOptions[o.name] ? '`True `' :
            '`False`'} **${o.name}** \`[${o.abbrev}]\`  *(${o.desc})*\n`);

    await res.save();

    return answer;
}

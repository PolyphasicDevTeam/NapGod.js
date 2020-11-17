const config = require('../../config.json');
const { findMember, findRole } = require('./find');
const { schedules, modifiers } = require('./schedules');
const UserModel = require('./../models/user.model');
const { cutAt, executeFunction, sendError } = require('./utility');
const CustomError = require('./error');

module.exports = {
  processAdapted: function (command, message, args, dry = false) {
    if (command === 'adapted') {
      console.log('CMD   : ADAPTED');
      console.log('ARGS  : ', args);
      const permissions = message.member.roles.some((d) =>
        ['Admins', 'Moderator'].includes(d.name)
      );
      if (!permissions) {
        let msg =
          'You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+adapted`';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      } else if (args.length >= 1) {
        executeFunction(adapt, message, args, dry);
      } else {
        let msg = 'Valid options are `+adapted (schedule) [username]`';
        console.log('MSG   : ', msg);
        if (!dry) {
          message.channel.send(msg);
        }
      }
      return true;
    }
    return false;
  },
};

async function adapt(message, args, dry) {
  let scheduleIdentifier = args[0];
  let { is_schedule, schedn, schedfull } = checkIsSchedule(scheduleIdentifier);
  let memberIdentifier = message.content
    .replace(config.prefix + 'adapted', '')
    .trim();
  if (is_schedule) {
    console.log('INFO  : ', 'Schedule1 is ', schedules[schedn].name);
    memberIdentifier = memberIdentifier
      .substring(memberIdentifier.indexOf(' '))
      .trim();
  }
  const changeCurrent = !is_schedule;
  let member = findMember(
    memberIdentifier,
    message.guild,
    message.mentions.users
  );
  if (member.found) {
    member = member.value;
    let run = true;
    const userDB = await UserModel.findOne({ id: member.id });
    if (!is_schedule) {
      if (userDB === null) {
        const msg = `${member.displayName} isn't doing any schedule!  Use +set or +mset for moderators to set a schedule."`;
        message.channel.send(msg);
        // STOP
        run = false;
      } else {
        scheduleIdentifier = userDB.currentScheduleName;
        ({ is_schedule, schedn, schedfull } = checkIsSchedule(
          scheduleIdentifier
        ));
        if (!is_schedule) {
          message.channel.send('Error in the database. Contact admins.');
          throw new CustomError(
            'DataError',
            `Incorrect schedule stored in databasse: ${scheduleIdentifier}`
          );
        } else {
          run = !userDB.historicSchedules[userDB.historicSchedules.length - 1]
            .adapted;
          if (!run) {
            const msg = `${member.displayName} is already adapted to ${userDB.currentScheduleName}`;
            message.channel.send(msg);
          }
        }
      }
    }
    if (run) {
      await adaptOne(member, userDB, schedfull, changeCurrent, message, dry);
    }
  } else {
    console.log(member.msg);
    if (!dry) {
      await message.channel.send(member.msg);
    }
  }
}

function checkIsSchedule(schedulePossible) {
  const schedp_arr = schedulePossible.trim().split(/-+/g);
  const schedn = schedp_arr[0].toLowerCase();
  if (Object.keys(schedules).includes(schedn)) {
    if (schedp_arr.length == 2) {
      const schedmod = schedp_arr[1].toLowerCase();
      if (Object.keys(modifiers).includes(schedmod)) {
        return {
          is_schedule: true,
          schedn,
          schedfull: schedules[schedn].name + '-' + modifiers[schedmod].name,
        };
      }
    } else if (schedp_arr.length == 1) {
      return { is_schedule: true, schedn, schedfull: schedules[schedn].name };
    }
  }
  return { is_schedule: false };
}

function findArrayMember(roles, name) {
  return [name, roles.find((d) => d.name === name)];
}

async function adaptOne(member, userDB, schedule, changeDB, message, dry) {
  let rolesToAdd = [];
  let rolesToDelete = [];
  if (changeDB) {
    const adapted = true;
    const userUpdate = buildUserInstance(member.user, message, schedule);
    const result = await saveUserSchedule(
      message,
      userUpdate,
      member.user,
      dry,
      adapted
    );
    const msg = `${member.user.tag} is now adapted`;
    console.log('INFO:  ', msg);
    console.log('Save User Schedule result:', result);
    await message.channel.send(msg);
    rolesToAdd.push(findArrayMember(member.guild.roles, 'Currently Adapted'));
  }
  rolesToDelete.push(
    findArrayMember(member.guild.roles, 'Attempted-' + schedule.split("-")[0])
  );
  rolesToAdd.push(findArrayMember(member.guild.roles, 'Adapted-' + schedule.split("-")[0]));
  let rolesToAddMsg = rolesToAdd.map((r) => r[0]).join(', ');
  let rolesToDeleteMsg = rolesToDelete.map((r) => r[0]).join(', ');
  if (
    rolesToAdd.some((r) => r[1] === null) ||
    rolesToDelete.some((r) => r[1] === null)
  ) {
    const msg = `At least one role is missing in the list: ${cutAt(
      rolesToAddMsg + ', ' + rolesToDeleteMsg,
      1000,
      '\n'
    )}`;
    console.log(msg);
    if (!dry) {
      await message.channel.send(msg);
    }
  } else {
    try {
      // different than tg command cause it's all or nothing, while tg add / delete everything it can
      let roles = member.roles;
      for (let role of rolesToDelete) {
        roles.delete(role[1].id);
      }
      for (let role of rolesToAdd) {
        roles.set(role[1].id, role[1]);
      }
      await member.setRoles(roles);
      const msg = `${member.user.tag} had gained the ${rolesToAddMsg} role(s) (if he didn't have them) and lost the ${rolesToDeleteMsg} role(s) (if he had them)`;
      console.log(msg);
      await message.channel.send(msg);
    } catch (e) {
      if (e.message === 'Missing Permissions') {
        const msg = `Can't assign roles to ${member.user.tag}`;
        console.log(msg);
        await message.channel.send(msg);
      } else {
        // error is managed by parent function, however, we wanted to manage missing permissions
        throw e;
      }
    }

  }
}

function buildUserInstance(user, message, sch) {
  let userUpdate = {
    tag: user.tag,
    userName: user.username,
    updatedAt: new Date(message.createdTimestamp),
  };
  userUpdate.currentScheduleName = sch;
  return userUpdate;
}

async function saveUserSchedule(message, userUpdate, author, dry, adapted) {
  const query = { id: author.id },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };
  let result = null;
  try {
    result = await UserModel.findOneAndUpdate(query, userUpdate, options);
    if (result) {
      result.historicSchedules.push({
        name: userUpdate.currentScheduleName,
        setAt: new Date(message.createdTimestamp),
        adapted: adapted,
      });
      await result.save();
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.log('error seraching for User: ', error);
    if (!dry) {
      await message.channel.send(
        'Something done broke.  Call the fire brigade'
      );
    }
    // error is managed by parent function, however, we wanted to send a specific message to the channel
    throw error;
  }
}

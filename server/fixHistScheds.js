const LogModel = require('./models/log.model');
const UserModel = require('./models/user.model');

module.exports = {
  fixHistLogs: async function () {
    let users = null;
    try {
      users = await UserModel.find();
    }
    catch(err) {
      console.error(err);
      return;
    }
    if (!users) {
      console.error("ERR: Could not find users");
      return;
    }
    await fixLogModels(users);
    await fixHistoric(users);
  }
};

async function fixLogModels(users) {
  for (const user of users) {
    let userLogs = null;
    try {
      userLogs = await LogModel.find({userName: user.userName});
    }
    catch(err) {
      console.error(err);
      return;
    }
    if (!userLogs) {
      console.error("ERR: Could not find logs");
      return;
    }
    if (!userLogs.length) {
      console.log(`INFO: No log found for ${user.userName}`);
    }
    userLogs.forEach(userLog => {
      let historicId = user.historicSchedules
        .filter((s) => s.name === userLog.schedule)
        .slice(-userLog.attempt)[0]
        ._id;
      console.log(`INFO: Setting id ${historicId} to ${userLog.schedule}` +
        ` attempt #${userLog.attempt} for ${user.userName}`);
      userLog.historicId = historicId;
      userLog.save();
    });
  }
}

async function fixHistoric(users) {
  users.forEach(user => {
    console.log(`INFO: Fixing history for user ${user.userName}`);
    for (let i = user.historicSchedules.length - 1; i; i--) {
      if (!user.historicSchedules[i].adaptDate &&
        user.historicSchedules[i].name === user.historicSchedules[i - 1].name &&
        user.historicSchedules[i].adapted && !user.historicSchedules[i - 1].adapted)
      {
        console.log(`INFO: Merging ${user.historicSchedules[i].name} at index ${i} with index ${i-1}`);
        user.historicSchedules[i - 1].adaptDate = user.historicSchedules[i].setAt;
        user.historicSchedules.splice(i, 1);
        i--;
      }
    }
    user.save();
  });
}

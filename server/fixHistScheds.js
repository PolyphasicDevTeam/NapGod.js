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
      userLogs = await LogModel.find({userName: {$regex : '^' + user.userName + '( [.*])?$'}});
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
      if (userLog.historicId) {
        return;
      }
      let historicId = user.historicSchedules
        .filter((s) => s.name === userLog.schedule)
        .slice(-userLog.attempt)[0]
        ._id;
      console.log(`INFO: Setting id ${historicId} to ${userLog.schedule}` +
        ` attempt #${userLog.attempt} for ${user.userName}`);
      userLog.userId = user.id;
      userLog.historicId = historicId;
      userLog.save();
    });
  }
}

async function fixHistoric(users) {
  users.forEach(async (user) => {
    console.log(`INFO: Fixing history for user ${user.userName}`);
    for (let i = user.historicSchedules.length - 1; i; i--) {
      if (!user.historicSchedules[i].adaptDate &&
        user.historicSchedules[i].name === user.historicSchedules[i - 1].name &&
        user.historicSchedules[i].adapted && !user.historicSchedules[i - 1].adapted)
      {
        console.log(`INFO: Merging ${user.historicSchedules[i].name} at index ${i} with index ${i-1}`);
        let adaptLogs = null;
        let preAdaptLogs = null;
        try {
          adaptLogs = await LogModel.findOne({userName: user.userName,
            historicId: user.historicSchedules[i]._id});
          preAdaptLogs = await LogModel.findOne({userName: user.userName,
            historicId: user.historicSchedules[i - 1]._id});
        }
        catch(err) {
          console.error(`Error fetching logmodels when merging: ${err}`);
          return;
        }
        if (adaptLogs && preAdaptLogs) {
          console.log(preAdaptLogs.entries);
          preAdaptLogs.entries.concat(adaptLogs.entries);
          preAdaptLogs.save();
          try {
            await LogMode.deleteOne({userName: user.userName,
              historicId: user.historicSchedules[i]._id});
          }
          catch(err) {
            console.err(`Error deleting adaptlog model: ${err}`);
            return;
          }
        }
        user.historicSchedules[i - 1].adaptDate = user.historicSchedules[i].setAt;
        user.historicSchedules.splice(i, 1);
        i--;
      }
    }
    user.save();
  });
}

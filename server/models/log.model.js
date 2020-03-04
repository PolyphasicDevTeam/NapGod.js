const mongoose = require('mongoose');

let schema = {
  userName: { type: String, required: true },
  schedule: { type: String, required: true},
  day: {type: Number, required: true},
  attempt: {type: Number, required: true},
  daySegments: {type: String, required: true},
  moods: {type: String, required: true},
  awakeDifficulty: {type: Number, required: true},
  sleepTime: {type: Number, required: true},
  oversleepTime: {type: Number},
  napsNumber: {type: Number},
  logMessage: {type: String},
  attachment: {type: String},
  loggedAt: {type: Date, default: Date.now}
};

module.exports = mongoose.model('Log', schema);

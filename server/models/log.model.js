const mongoose = require('mongoose');

let schema = {
  userName: { type: String },
  userId: { type: String, required: true },
  schedule: { type: String, required: true },
  attempt: { type: Number, required: false },
  historicId: { type: String, required: true },

  monoSleep: { type: String },
  experience: { type: String },
  previousFeeling: { type: String },
  sleepDep: { type: String },
  previousSched: { type: String },
  monoDep: { type: String },
  polyDep: { type: String },
  polyNDep: { type: String },
  reasonChange: { type: String },

  entries: [
    {
      day: { type: Number, required: true },
      daySegments: { type: String, required: true },
      moods: { type: String, required: true },
      awakeDifficulty: { type: Number, required: true },
      sleepTime: { type: Number, required: true },
      oversleepTime: { type: Number },
      napsNumber: { type: Number },
      segments : [
          {
              title: { type: String },
              field: { type: String }
          }
      ],
      logMessage: { type: String }, // Recap + Attachment msg
      attachment: { type: String },
      loggedAt: { type: Date, default: Date.now }
    }
  ]
};

module.exports = mongoose.model('Log', schema);

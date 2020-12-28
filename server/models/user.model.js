const mongoose = require('mongoose');

let schema = {
  tag: { type: String, required: true },
  userName: { type: String, required: true },
  id: { type: String, required: true, index: true },
  scheduleVerified: { type: Boolean, required: true, default: false },
  currentScheduleName: { type: String},
  currentScheduleChart: { type: String },
  currentScheduleSleeps: { type: String },
  historicSchedules: [
    {
      name: { type: String, required: true },
      setAt: { type: Date, requried: true },
      adapted: { type: Boolean, default: false }, // TODO: remove after fixedHistLogs was run and removed
      adaptDate: { type: Date, required: false },
      maxLogged: { type: Number, default: 0 }
    }
  ],
  historicScheduleCharts: [
    {
      url: { type: String, required: true },
      setAt: { type: Date, requried: true }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  timezone: { type: Number, default: null },
  logOptions: {
        enableSegment: { type: Boolean, default: true },
        enableSegmentField: { type: Boolean, default: true },
        enableSegmentFieldGap: { type: Boolean, default: true }
  },
};

module.exports = mongoose.model('User', schema);

const mongoose = require('mongoose');

let schema = {
  tag: { type: String, required: true },
  userName: { type: String, required: true },
  id: { type: String, required: true, index: true },
  currentScheduleName: { type: String},
  currentScheduleChart: { type: String },
  currentScheduleSleeps: { type: String },
  currentScheduleMaxLogged: { type: Number },
  historicSchedules: [
    {
      name: { type: String, required: true },
      setAt: { type: Date, requried: true },
      adapted: { type: Boolean, required: true },
      maxLogged: { type: Number, required: true, default: 0 }
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

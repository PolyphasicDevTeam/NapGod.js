const mongoose = require('mongoose');

let schema = {
  tag: { type: String, required: true },
  userName: { type: String, required: true },
  id: { type: String, required: true },
  currentScheduleName: { type: String},
  currentScheduleChart: { type: String },
  historicSchedules: [
    {
      name: { type: String, required: true },
      setAt: { type: Date, requried: true },
      adapted: { type: Boolean, required: true }
    }
  ],
  historicScheduleCharts: [
    {
      url: { type: String, required: true },
      setAt: { type: Date, requried: true }
    }
  ],
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
};

module.exports = mongoose.model('User', schema);

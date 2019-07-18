const mongoose = require('mongoose');

let schema = new mongoose.Schema(
  {
    updatedAt: {type: Date, default: Date.now},
    lastSetAt: {type: Date, default: Date.now},
  },
  {
    capped: {
      size: 100000,
      max: 1
    }
  }
);

module.exports = mongoose.model('report', schema);

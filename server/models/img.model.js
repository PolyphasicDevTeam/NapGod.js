const mongoose = require('mongoose');

let schema = {
  napchartid: { type: String, required: true, index: true },
  url: { type: String, required: true },
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
};

module.exports = mongoose.model('Img', schema);

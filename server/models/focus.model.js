const mongoose = require('mongoose');

let schema = {
    id: { type: String, required: true, index: true },
    endDate: {type: Date, required: true}
};

module.exports = mongoose.model('Focus', schema);

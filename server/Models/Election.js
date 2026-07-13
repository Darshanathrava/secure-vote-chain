const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
  title:           { type: String },
  description:     { type: String },
  startTime:       { type: Date },
  endTime:         { type: Date },
  isActive:        { type: Boolean, default: true },
  contractAddress: { type: String }
});

module.exports = mongoose.model('Election', ElectionSchema);
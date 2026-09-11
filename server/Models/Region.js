const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  code:        { type: String, required: true, unique: true },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Region', RegionSchema);
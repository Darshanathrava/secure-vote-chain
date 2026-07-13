const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  voterId:         { type: String, required: true, unique: true },
  name:            { type: String },
  email:           { type: String, unique: true },
  password:        { type: String },
  faceEncoding:    { type: [Number], default: [] },
  hasVoted:        { type: Boolean, default: false },
  walletAddress:   { type: String, default: '' },
  transactionHash: { type: String, default: null },
  votedCandidate:  { type: Number, default: null },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
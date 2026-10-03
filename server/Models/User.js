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
  votedCandidate:  { type: String, default: null },
  webauthnCredential: {
    id:         { type: String },
    publicKey:  { type: String },
    counter:    { type: Number, default: 0 },
    transports: { type: [String], default: [] },
  },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

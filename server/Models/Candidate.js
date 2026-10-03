const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name:                  { type: String, required: true },
  party:                 { type: String, required: true },
  region:                { type: String, default: 'National' },
  symbol:                { type: String },
  votes:                 { type: Number, default: 0 },
  blockchainCandidateId: { type: Number },
  createdAt:             { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', CandidateSchema);

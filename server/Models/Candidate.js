const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name:                  { type: String },
  party:                 { type: String },
  electionId:            { type: mongoose.Schema.Types.ObjectId },
  blockchainCandidateId: { type: Number }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
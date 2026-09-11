require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./Routes/AuthRoute');
const voteRoutes = require('./Routes/voteRoute');
const adminRoutes = require('./Routes/adminRoute');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/admin', adminRoutes);

async function getCandidatesWithVotes() {
  const Candidate = require('./Models/Candidate');
  const User = require('./Models/User');
  const candidates = await Candidate.find().sort({ createdAt: 1 });
  const voteCounts = await User.aggregate([
    { $match: { hasVoted: true, votedCandidate: { $ne: null } } },
    { $group: { _id: '$votedCandidate', votes: { $sum: 1 } } },
  ]);
  const votesById = Object.fromEntries(voteCounts.map((row) => [String(row._id), row.votes]));

  return candidates.map((candidate, index) => {
    const blockchainId = candidate.blockchainCandidateId || index + 1;
    return {
      ...candidate.toObject(),
      id: candidate._id,
      blockchainCandidateId: blockchainId,
      voteCount: votesById[String(blockchainId)] || 0,
    };
  });
}

app.get('/api/candidates', async (req, res) => {
  try {
    res.json(await getCandidatesWithVotes());
  } catch (err) {
    console.error('Candidates fetch error:', err);
    res.status(500).json({ error: 'Could not fetch candidates' });
  }
});

app.get('/api/elections', async (req, res) => {
  try {
    const Election = require('./Models/Election');
    let elections = await Election.find({ isActive: true });

    if (elections.length === 0) {
      const created = await Election.create({
        title: 'General Election',
        description: 'Cast your vote securely',
        isActive: true,
      });
      elections = [created];
    }

    const candidates = await getCandidatesWithVotes();
    res.json(elections.map((election) => ({
      ...election.toObject(),
      candidates,
    })));
  } catch (err) {
    console.error('Elections fetch error:', err);
    res.status(500).json({ error: 'Could not fetch elections' });
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected With DB Successfull');
    app.listen(process.env.PORT || 1322, () => {
      console.log(`Server is Listening on PORT ${process.env.PORT || 1322}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));
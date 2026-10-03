require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./Routes/AuthRoute');
const voteRoutes = require('./Routes/voteRoute');
const adminRoutes = require('./Routes/adminRoute');
const webauthnRoutes = require('./Routes/webauthnRoute');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webauthn', webauthnRoutes);

async function getCandidatesWithVotes() {
  const Candidate = require('./Models/Candidate');
  const candidates = await Candidate.find().sort({ votes: -1, createdAt: 1 });

  return candidates.map((candidate, index) => ({
    ...candidate.toObject(),
    id: candidate._id,
    blockchainCandidateId: candidate.blockchainCandidateId || index + 1,
    votes: candidate.votes || 0,
    voteCount: candidate.votes || 0,
  }));
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
const User = require('../Models/User');
const { verifyFace } = require('../utils/faceUtils');
const path = require('path');
const fs = require('fs');

// POST /api/vote/cast
exports.castVote = async (req, res) => {
  try {
    const { voterId, faceImageBase64, candidateId, transactionHash } = req.body;

    // 1. Find user
    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });

    // 2. Check if already voted
    if (user.hasVoted) {
      return res.status(400).json({ error: 'You have already voted' });
    }

    // 3. Verify face before allowing vote
    const tmpPath = path.join(__dirname, `../tmp/${voterId}_vote.jpg`);
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, Buffer.from(faceImageBase64, 'base64'));
    const result = await verifyFace(tmpPath, user.faceEncoding);
    fs.unlinkSync(tmpPath);

    if (!result.match) {
      return res.status(401).json({ error: 'Face verification failed. Vote rejected.' });
    }

    // 4. Mark user as voted + save transaction hash
    user.hasVoted = true;
    user.transactionHash = transactionHash; // from MetaMask on frontend
    user.votedCandidate = candidateId;
    await user.save();

    res.json({
      message: 'Vote cast successfully',
      transactionHash,
      candidateId,
    });

  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Voting failed' });
  }
};

// GET /api/vote/status/:voterId
exports.getVoteStatus = async (req, res) => {
  try {
    const { voterId } = req.params;
    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });

    res.json({
      hasVoted: user.hasVoted,
      transactionHash: user.transactionHash || null,
      votedCandidate: user.votedCandidate || null,
    });

  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Could not fetch vote status' });
  }
};

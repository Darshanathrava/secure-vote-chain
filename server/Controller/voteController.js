const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const User = require('../Models/User');
const Candidate = require('../Models/Candidate');
const { verifyFace } = require('../utils/faceUtils');

// POST /api/vote/verify-face — Step 1 of voting flow
exports.verifyFaceForVote = async (req, res) => {
  try {
    const { voterId, faceImageBase64 } = req.body;
    if (!voterId || !faceImageBase64) {
      return res.status(400).json({ error: 'voterId and faceImageBase64 are required' });
    }

    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });
    if (user.hasVoted) return res.status(400).json({ error: 'You have already voted' });
    if (!user.faceEncoding?.length) {
      return res.status(400).json({ error: 'No face encoding on file for this voter' });
    }

    const tmpPath = path.join(__dirname, `../tmp/${voterId}_vote_face.jpg`);
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, Buffer.from(faceImageBase64, 'base64'));

    let result;
    try {
      result = await verifyFace(tmpPath, user.faceEncoding);
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }

    if (!result.match) {
      return res.status(401).json({
        error: 'Face verification failed',
        similarity: result.similarity ?? null,
      });
    }

    res.json({
      match: true,
      similarity: result.similarity ?? null,
      fingerprintRegistered: Boolean(user.webauthnCredential?.id),
    });
  } catch (err) {
    console.error('Face verify error:', err);
    res.status(500).json({ error: 'Face verification failed' });
  }
};

// POST /api/vote/cast
exports.castVote = async (req, res) => {
  try {
    const { voterId, faceImageBase64, candidateId } = req.body;

    if (!voterId || !faceImageBase64 || !candidateId) {
      return res.status(400).json({
        error: 'voterId, faceImageBase64, and candidateId are required',
      });
    }

    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });

    if (user.hasVoted) {
      return res.status(400).json({ error: 'You have already voted' });
    }

    // Re-verify face before accepting the ballot
    const tmpPath = path.join(__dirname, `../tmp/${voterId}_vote.jpg`);
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, Buffer.from(faceImageBase64, 'base64'));

    let result;
    try {
      result = await verifyFace(tmpPath, user.faceEncoding);
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }

    if (!result.match) {
      return res.status(401).json({ error: 'Face verification failed. Vote rejected.' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const transactionHash = '0x' + crypto.randomBytes(32).toString('hex');

    candidate.votes = (candidate.votes || 0) + 1;
    await candidate.save();

    user.hasVoted = true;
    user.transactionHash = transactionHash;
    user.votedCandidate = String(candidate._id);
    await user.save();

    res.json({
      message: 'Vote cast successfully',
      transactionHash,
      candidateId: candidate._id,
    });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Voting failed' });
  }
};

// GET /api/vote/results
exports.getResults = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ votes: -1, createdAt: 1 });
    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

    res.json({
      totalVotes,
      candidates: candidates.map((c) => ({
        ...c.toObject(),
        id: c._id,
        votes: c.votes || 0,
        voteCount: c.votes || 0,
      })),
    });
  } catch (err) {
    console.error('Results error:', err);
    res.status(500).json({ error: 'Could not fetch results' });
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
      fingerprintRegistered: Boolean(user.webauthnCredential?.id),
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Could not fetch vote status' });
  }
};

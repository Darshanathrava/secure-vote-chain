const Admin = require('../Models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Dynamically require models to avoid circular deps
const getCandidateModel = () => {
  try { return require('../Models/Candidate'); } catch { return null; }
};
const getRegionModel = () => {
  try { return require('../Models/Region'); } catch { return null; }
};
const getElectionModel = () => {
  try { return require('../Models/Election'); } catch { return null; }
};
const getUserModel = () => {
  try { return require('../Models/User'); } catch { return null; }
};

// POST /api/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { adminId: admin._id, username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, username });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// POST /api/admin/setup — creates first admin (run once)
exports.setupAdmin = async (req, res) => {
  try {
    const existing = await Admin.findOne({});
    if (existing) return res.status(400).json({ error: 'Admin already exists' });
    const { username, password } = req.body;
    const admin = new Admin({ username, password });
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Setup failed' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const User = getUserModel();
    const Candidate = getCandidateModel();
    const Election = getElectionModel();
    const Region = getRegionModel();

    const [voters, candidates, elections, regions] = await Promise.all([
      User ? User.countDocuments() : 0,
      Candidate ? Candidate.countDocuments() : 0,
      Election ? Election.countDocuments() : 0,
      Region ? Region.countDocuments() : 0,
    ]);
    const votedCount = User ? await User.countDocuments({ hasVoted: true }) : 0;

    res.json({ voters, candidates, elections, regions, votedCount });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch stats' });
  }
};

// ── CANDIDATES ──────────────────────────────────────────

// GET /api/admin/candidates
exports.getCandidates = async (req, res) => {
  try {
    const Candidate = require('../Models/Candidate');
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch candidates' });
  }
};

// POST /api/admin/candidates
exports.addCandidate = async (req, res) => {
  try {
    const Candidate = require('../Models/Candidate');
    const { name, party, region, blockchainCandidateId } = req.body;
    const candidate = new Candidate({ name, party, region, blockchainCandidateId });
    await candidate.save();
    res.status(201).json({ message: 'Candidate added', candidate });
  } catch (err) {
    res.status(500).json({ error: 'Could not add candidate' });
  }
};

// PUT /api/admin/candidates/:id
exports.updateCandidate = async (req, res) => {
  try {
    const Candidate = require('../Models/Candidate');
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    res.json({ message: 'Candidate updated', candidate });
  } catch (err) {
    res.status(500).json({ error: 'Could not update candidate' });
  }
};

// DELETE /api/admin/candidates/:id
exports.deleteCandidate = async (req, res) => {
  try {
    const Candidate = require('../Models/Candidate');
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete candidate' });
  }
};

// ── REGIONS ─────────────────────────────────────────────

// GET /api/admin/regions
exports.getRegions = async (req, res) => {
  try {
    const Region = require('../Models/Region');
    const regions = await Region.find();
    res.json(regions);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch regions' });
  }
};

// POST /api/admin/regions
exports.addRegion = async (req, res) => {
  try {
    const Region = require('../Models/Region');
    const { name, code, description } = req.body;
    const region = new Region({ name, code, description });
    await region.save();
    res.status(201).json({ message: 'Region added', region });
  } catch (err) {
    res.status(500).json({ error: 'Could not add region' });
  }
};

// DELETE /api/admin/regions/:id
exports.deleteRegion = async (req, res) => {
  try {
    const Region = require('../Models/Region');
    await Region.findByIdAndDelete(req.params.id);
    res.json({ message: 'Region deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete region' });
  }
};
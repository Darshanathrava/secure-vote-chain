const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../Models/User');
const { verifyFace, encodeFace } = require('../utils/faceUtils');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { voterId, name, email, password, walletAddress, faceImageBase64 } = req.body;

    // 1. Check if voter already exists
    const existing = await User.findOne({ voterId });
    if (existing) return res.status(400).json({ error: 'Voter ID already registered' });

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Encode face
    const tmpPath = path.join(__dirname, `../tmp/${voterId}_reg.jpg`);
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, Buffer.from(faceImageBase64, 'base64'));
    const faceEncoding = await encodeFace(tmpPath);
    fs.unlinkSync(tmpPath);

    if (!faceEncoding) return res.status(400).json({ error: 'No face detected in image' });

    // 4. Save user
    const user = new User({
      voterId,
      name,
      email,
      password: hashedPassword,
      faceEncoding,
      walletAddress,
    });
    await user.save();

    res.status(201).json({ message: 'Voter registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { voterId, password, faceImageBase64 } = req.body;

    // 1. Find user
    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2. Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // 3. Save temp image & run face verification
    const tmpPath = path.join(__dirname, `../tmp/${voterId}_live.jpg`);
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, Buffer.from(faceImageBase64, 'base64'));
    const result = await verifyFace(tmpPath, user.faceEncoding);
    fs.unlinkSync(tmpPath);

    if (!result.match) return res.status(401).json({ error: 'Face verification failed' });

    // 4. Issue JWT
    const token = jwt.sign(
      { userId: user._id, voterId },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, walletAddress: user.walletAddress });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

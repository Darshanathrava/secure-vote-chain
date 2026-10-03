const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const User = require('../Models/User');

const rpName = 'Secure Vote Chain';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

// In-memory challenge store (demo). Keyed by voterId.
const challenges = new Map();

function toBase64URL(value) {
  if (typeof value === 'string') return value;
  return Buffer.from(value).toString('base64url');
}

function fromBase64URL(base64url) {
  return new Uint8Array(Buffer.from(base64url, 'base64url'));
}

// POST /api/webauthn/register/options
exports.getRegistrationOptions = async (req, res) => {
  try {
    const { voterId } = req.body;
    if (!voterId) return res.status(400).json({ error: 'voterId is required' });

    const user = await User.findOne({ voterId });
    if (!user) {
      return res.status(404).json({ error: 'Voter not found. Register your account first.' });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user._id.toString()),
      userName: voterId,
      userDisplayName: user.name || voterId,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      excludeCredentials: user.webauthnCredential?.id
        ? [{
            id: user.webauthnCredential.id,
            transports: user.webauthnCredential.transports || [],
          }]
        : [],
    });

    challenges.set(voterId, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('WebAuthn register options error:', err);
    res.status(500).json({ error: 'Could not start fingerprint enrollment' });
  }
};

// POST /api/webauthn/register/verify
exports.verifyRegistration = async (req, res) => {
  try {
    const { voterId, attestationResponse } = req.body;
    if (!voterId || !attestationResponse) {
      return res.status(400).json({ error: 'voterId and attestationResponse are required' });
    }

    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });

    const expectedChallenge = challenges.get(voterId);
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'No enrollment challenge found. Start enrollment again.' });
    }

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    challenges.delete(voterId);

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Fingerprint enrollment failed' });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    user.webauthnCredential = {
      id: credential.id,
      publicKey: toBase64URL(credential.publicKey),
      counter: credential.counter ?? 0,
      transports: credential.transports || attestationResponse.response?.transports || [],
    };
    user.markModified('webauthnCredential');
    await user.save();

    res.json({
      verified: true,
      credentialDeviceType,
      credentialBackedUp,
    });
  } catch (err) {
    console.error('WebAuthn register verify error:', err);
    res.status(500).json({ error: err.message || 'Fingerprint enrollment verification failed' });
  }
};

// POST /api/webauthn/authenticate/options
exports.getAuthenticationOptions = async (req, res) => {
  try {
    const { voterId } = req.body;
    if (!voterId) return res.status(400).json({ error: 'voterId is required' });

    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });
    if (!user.webauthnCredential?.id) {
      return res.status(400).json({ error: 'No fingerprint registered for this voter' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: [
        {
          id: user.webauthnCredential.id,
          transports: user.webauthnCredential.transports || [],
        },
      ],
    });

    challenges.set(voterId, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('WebAuthn auth options error:', err);
    res.status(500).json({ error: 'Could not start fingerprint verification' });
  }
};

// POST /api/webauthn/authenticate/verify
exports.verifyAuthentication = async (req, res) => {
  try {
    const { voterId, assertionResponse } = req.body;
    if (!voterId || !assertionResponse) {
      return res.status(400).json({ error: 'voterId and assertionResponse are required' });
    }

    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });
    if (!user.webauthnCredential?.id) {
      return res.status(400).json({ error: 'No fingerprint registered for this voter' });
    }

    const expectedChallenge = challenges.get(voterId);
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'No authentication challenge found. Try again.' });
    }

    const credential = {
      id: user.webauthnCredential.id,
      publicKey: fromBase64URL(user.webauthnCredential.publicKey),
      counter: user.webauthnCredential.counter || 0,
      transports: user.webauthnCredential.transports || [],
    };

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential,
    });

    challenges.delete(voterId);

    if (!verification.verified) {
      return res.status(401).json({ error: 'Fingerprint verification failed' });
    }

    user.webauthnCredential.counter = verification.authenticationInfo.newCounter;
    user.markModified('webauthnCredential');
    await user.save();

    res.json({ verified: true });
  } catch (err) {
    console.error('WebAuthn auth verify error:', err);
    res.status(500).json({ error: err.message || 'Fingerprint verification failed' });
  }
};

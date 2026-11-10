const crypto = require('crypto');
const User = require('../Models/User');

const MAX_AGE_MS = 2 * 60 * 1000; // capture must be fresh

function attr(xml, tag, name) {
  const m = xml.match(new RegExp(`<${tag}\\b[^>]*\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function tagText(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : null;
}

/** Validate a PID block from the Mantra RD Service. Returns {error} or {device, hash}. */
function inspectPid(pidXml) {
  if (typeof pidXml !== 'string' || pidXml.length < 100 || pidXml.length > 200000) {
    return { error: 'Invalid fingerprint data' };
  }
  if (!/<PidData[\s>]/.test(pidXml)) return { error: 'Not a PID block' };
  if (attr(pidXml, 'Resp', 'errCode') !== '0') return { error: 'Fingerprint capture was not successful' };

  const data = tagText(pidXml, 'Data');
  const skey = tagText(pidXml, 'Skey');
  const hmac = tagText(pidXml, 'Hmac');
  if (!data || !skey || !hmac) return { error: 'Incomplete fingerprint capture' };

  const dpId = attr(pidXml, 'DeviceInfo', 'dpId');
  const rdsId = attr(pidXml, 'DeviceInfo', 'rdsId');
  if (!dpId || !rdsId) return { error: 'Capture is not from a registered device' };

  // Reject replays: the encrypted block is unique per capture.
  const hash = crypto.createHash('sha256').update(data + skey + hmac).digest('hex');
  return { device: `${dpId}|${rdsId}`, hash };
}

async function handle(req, res, mode) {
  try {
    const { voterId, pidXml } = req.body || {};
    if (!voterId || !pidXml) return res.status(400).json({ error: 'voterId and pidXml are required' });

    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ error: 'Voter not found' });

    const pid = inspectPid(pidXml);
    if (pid.error) return res.status(400).json({ error: pid.error });

    const used = user.fingerprint?.usedCaptures || [];
    if (used.includes(pid.hash)) {
      return res.status(400).json({ error: 'This capture was already used. Scan again.' });
    }

    if (mode === 'verify') {
      if (!user.fingerprint?.registered) {
        return res.status(400).json({ error: 'No fingerprint registered for this voter' });
      }
      if (user.fingerprint.device !== pid.device) {
        return res.status(401).json({ error: 'Scanner does not match the registered device' });
      }
    }

    user.fingerprint = {
      registered: true,
      device: mode === 'enroll' ? pid.device : user.fingerprint.device,
      enrolledAt: mode === 'enroll' ? new Date() : user.fingerprint.enrolledAt,
      lastVerifiedAt: mode === 'verify' ? new Date() : user.fingerprint?.lastVerifiedAt,
      usedCaptures: [...used, pid.hash].slice(-50),
    };
    user.markModified('fingerprint');
    await user.save();

    res.json({ verified: true });
  } catch (err) {
    console.error(`Fingerprint ${mode} error:`, err);
    res.status(500).json({ error: `Fingerprint ${mode} failed` });
  }
}

exports.enroll = (req, res) => handle(req, res, 'enroll');
exports.verify = (req, res) => handle(req, res, 'verify');

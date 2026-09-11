const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

function isVenvBroken(venvPython) {
  const cfgPath = path.join(path.dirname(venvPython), '..', 'pyvenv.cfg');
  if (!fs.existsSync(cfgPath)) return false;

  const cfg = fs.readFileSync(cfgPath, 'utf8');
  const executableMatch = cfg.match(/^executable\s*=\s*(.+)$/m);
  const homeMatch = cfg.match(/^home\s*=\s*(.+)$/m);

  const candidates = [];
  if (executableMatch) candidates.push(executableMatch[1].trim().replace(/^["']|["']$/g, ''));
  if (homeMatch) {
    const home = homeMatch[1].trim().replace(/^["']|["']$/g, '');
    candidates.push(path.join(home, process.platform === 'win32' ? 'python.exe' : 'python'));
  }

  return candidates.some((candidate) => candidate && !fs.existsSync(candidate));
}

function getPythonExecutable() {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }

  const venvPython =
    process.platform === 'win32'
      ? path.join(__dirname, '../venv/Scripts/python.exe')
      : path.join(__dirname, '../venv/bin/python');

  if (fs.existsSync(venvPython) && !isVenvBroken(venvPython)) {
    return venvPython;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

const PYTHON_EXECUTABLE = getPythonExecutable();

function runPython(scriptName, args) {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON_EXECUTABLE,
      [path.join(__dirname, '../face_service', scriptName), ...args],
      { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const detail = (stderr || err.message || '').trim();
          return reject(new Error(detail || `Face service failed (${scriptName})`));
        }

        try {
          resolve(JSON.parse((stdout || '').trim() || 'null'));
        } catch (parseErr) {
          reject(new Error(`Invalid face service output: ${(stdout || stderr || '').trim()}`));
        }
      },
    );
  });
}

function verifyFace(imagePath, storedEncoding) {
  return runPython('verify_face.py', [imagePath, JSON.stringify(storedEncoding)]);
}

function encodeFace(imagePath) {
  return runPython('encode_faces.py', [imagePath]);
}

module.exports = { verifyFace, encodeFace };

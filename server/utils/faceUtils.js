const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

function getPythonExecutable() {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  const venvPython =
    process.platform === 'win32'
      ? path.join(__dirname, '../venv/Scripts/python.exe')
      : path.join(__dirname, '../venv/bin/python');

  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

const PYTHON_EXECUTABLE = getPythonExecutable();

function verifyFace(imagePath, storedEncoding) {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON_EXECUTABLE,
      [
        path.join(__dirname, '../face_service/verify_face.py'),
        imagePath,
        JSON.stringify(storedEncoding),
      ],
      (err, stdout) => {
        if (err) return reject(err);
        resolve(JSON.parse(stdout));
      },
    );
  });
}

function encodeFace(imagePath) {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON_EXECUTABLE,
      [path.join(__dirname, '../face_service/encode_faces.py'), imagePath],
      (err, stdout) => {
        if (err) return reject(err);
        resolve(JSON.parse(stdout));
      },
    );
  });
}

module.exports = { verifyFace, encodeFace };
const express = require('express');
const router = express.Router();
const { enroll, verify } = require('../Controller/fingerprintController');

router.post('/enroll', enroll);
router.post('/verify', verify);

module.exports = router;

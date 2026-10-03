const express = require('express');
const router = express.Router();
const {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
} = require('../Controller/webauthnController');

router.post('/register/options', getRegistrationOptions);
router.post('/register/verify', verifyRegistration);
router.post('/authenticate/options', getAuthenticationOptions);
router.post('/authenticate/verify', verifyAuthentication);

module.exports = router;

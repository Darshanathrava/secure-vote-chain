const express = require('express');
const router = express.Router();
const {
  castVote,
  getVoteStatus,
  getResults,
  verifyFaceForVote,
} = require('../Controller/voteController');

router.post('/verify-face', verifyFaceForVote);
router.post('/cast', castVote);
router.get('/results', getResults);
router.get('/status/:voterId', getVoteStatus);

module.exports = router;

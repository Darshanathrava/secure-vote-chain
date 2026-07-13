const express = require('express');
const router = express.Router();
const { castVote, getVoteStatus } = require('../Controller/voteController');

router.post('/cast', castVote);
router.get('/status/:voterId', getVoteStatus);

module.exports = router;
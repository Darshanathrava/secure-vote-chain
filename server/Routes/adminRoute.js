const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  adminLogin, setupAdmin, getStats,
  getCandidates, addCandidate, updateCandidate, deleteCandidate,
  getRegions, addRegion, deleteRegion,
  getVoters, deleteVoter
} = require('../Controller/adminController');

// Public
router.post('/login', adminLogin);
router.post('/setup', setupAdmin);

// Protected — require admin token
router.get('/stats', adminAuth, getStats);
router.get('/candidates', adminAuth, getCandidates);
router.post('/candidates', adminAuth, addCandidate);
router.put('/candidates/:id', adminAuth, updateCandidate);
router.delete('/candidates/:id', adminAuth, deleteCandidate);
router.get('/regions', adminAuth, getRegions);
router.post('/regions', adminAuth, addRegion);
router.delete('/regions/:id', adminAuth, deleteRegion);
router.get('/voters', adminAuth, getVoters);
router.delete('/voters/:id', adminAuth, deleteVoter);

module.exports = router;
const express = require('express');
const router = express.Router();
const Formation = require('../models/Formation');

// GET /api/formations
router.get('/', async (req, res) => {
  try {
    const formations = await Formation.find().sort({ name: 1 }).lean();
    res.json({ formations, count: formations.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/formations/:id
router.get('/:id', async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id).lean();
    if (!formation) return res.status(404).json({ error: true, message: 'Formation not found' });
    res.json({ formation });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;

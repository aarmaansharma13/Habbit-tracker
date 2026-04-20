const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getHabits, createHabit, updateHabit, deleteHabit, toggleLog, getStats } = require('../controllers/habitController');

router.use(auth); // All habit routes are protected

router.get('/stats', getStats);      // ⚠️ Must be BEFORE /:id
router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/toggle', toggleLog);

module.exports = router;
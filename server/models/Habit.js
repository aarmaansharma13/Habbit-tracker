const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  date:      { type: String, required: true },
  completed: { type: Boolean, default: true }
}, { _id: false });

const HabitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:   { type: String, required: true, trim: true },
  color:  { type: String, default: '#93c5fd' },
  logs:   [LogSchema]
}, { timestamps: true });

module.exports = mongoose.model('Habit', HabitSchema);
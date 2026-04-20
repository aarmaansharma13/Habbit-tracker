const Habit = require('../models/Habit');

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort('createdAt');
    res.json(habits);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createHabit = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Habit name required' });
    const habit = await Habit.create({ userId: req.user._id, name, color: color || '#93c5fd' });
    res.status(201).json(habit);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name: req.body.name, color: req.body.color },
      { new: true }
    );
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleLog = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: 'Date required (YYYY-MM-DD)' });
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    const existing = habit.logs.find(l => l.date === date);
    if (existing) existing.completed = !existing.completed;
    else habit.logs.push({ date, completed: true });
    await habit.save();
    res.json(habit);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const { year, month } = req.query; // month is 0-indexed
    const y = parseInt(year), m = parseInt(month);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const habits = await Habit.find({ userId: req.user._id });

    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = (d) => `${y}-${pad(m + 1)}-${pad(d)}`;

    let totalCompleted = 0;
    const totalPossible = habits.length * daysInMonth;

    const habitStats = habits.map(habit => {
      let completed = 0;
      for (let d = 1; d <= daysInMonth; d++)
        if (habit.logs.find(l => l.date === dateStr(d) && l.completed)) completed++;
      totalCompleted += completed;
      return {
        _id: habit._id, name: habit.name, color: habit.color,
        completed, total: daysInMonth,
        progress: daysInMonth > 0 ? parseFloat(((completed / daysInMonth) * 100).toFixed(1)) : 0
      };
    }).sort((a, b) => b.progress - a.progress);

    // Weekly breakdown
    const weeks = [];
    let day = 1, weekNum = 1;
    while (day <= daysInMonth) {
      const weekEnd = Math.min(day + 6, daysInMonth);
      const daysInWeek = weekEnd - day + 1;
      let weekCompleted = 0;
      for (let d = day; d <= weekEnd; d++)
        habits.forEach(h => { if (h.logs.find(l => l.date === dateStr(d) && l.completed)) weekCompleted++; });
      const weekTotal = habits.length * daysInWeek;
      weeks.push({
        week: weekNum++, completed: weekCompleted, total: weekTotal,
        progress: weekTotal > 0 ? parseFloat(((weekCompleted / weekTotal) * 100).toFixed(1)) : 0
      });
      day += 7;
    }

    res.json({
      dailyProgress: totalPossible > 0 ? parseFloat(((totalCompleted / totalPossible) * 100).toFixed(2)) : 0,
      totalCompleted, totalPossible, habitStats, weeks
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
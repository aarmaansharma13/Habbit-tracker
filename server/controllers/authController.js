const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const userPayload = (u) => ({ id: u._id, name: u.name, email: u.email, avatar: u.avatar, affirmation: u.affirmation });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });
    if (!(await user.comparePassword(password))) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMe = (req, res) => res.json(userPayload(req.user));

exports.updateAffirmation = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { affirmation: req.body.affirmation }, { new: true });
    res.json({ affirmation: user.affirmation });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
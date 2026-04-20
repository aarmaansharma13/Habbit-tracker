const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const { register, login, getMe, updateAffirmation } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        auth, getMe);
router.put('/affirmation', auth, updateAffirmation);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/index.html?error=auth_failed`
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    // ✅ Redirect to /auth/callback (matches the Express route above)
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;
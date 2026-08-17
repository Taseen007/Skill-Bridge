// routes/user.js (or wherever your user routes are defined)
import express from 'express';
import { register, login, logout, updateProfile, getUserById, upgradeRole } from '../controllers/user.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js'; // Your auth middleware
import { singleUpload } from '../middlewares/multer.js'; // Your multer middleware
import passport from '../utils/passport.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.route('/register').post(singleUpload, register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/profile/update').post(isAuthenticated, singleUpload, updateProfile);
router.route('/profile/upgrade-role').patch(isAuthenticated, upgradeRole);
const oauthStart = (provider) => (req, res, next) => {
  if ((provider === 'google' && !process.env.GOOGLE_CLIENT_ID) || (provider === 'github' && !process.env.GITHUB_CLIENT_ID)) return res.status(503).json({ message: `${provider} OAuth is not configured`, success: false });
  const scope = provider === 'github' ? ['read:user', 'user:email'] : ['profile', 'email'];
  passport.authenticate(provider, { scope, session: false })(req, res, next);
};
const oauthCallback = (provider) => (req, res, next) => passport.authenticate(provider, { session: false }, (error, user) => {
  if (error || !user) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/signin?oauthError=1`);
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
  res.cookie('token', token, { maxAge: 86400000, httpOnly: true, sameSite: 'strict' });
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth/callback?token=${encodeURIComponent(token)}`);
})(req, res, next);
router.get('/oauth/google', oauthStart('google'));
router.get('/oauth/google/callback', oauthCallback('google'));
router.get('/oauth/github', oauthStart('github'));
router.get('/oauth/github/callback', oauthCallback('github'));
router.route('/:id').get(isAuthenticated, getUserById);

export default router;

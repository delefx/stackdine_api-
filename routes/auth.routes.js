// const express = require('express');
// const router = express.Router();
// const {
//   register,
//   login,
//   getMe,
//   changePassword,
// } = require('../controllers/auth.controller');
// const { protect } = require('../middleware/auth.middleware');

// router.post('/register', register);
// router.post('/login', login);
// router.get('/me', protect, getMe);
// router.put('/change-password', protect, changePassword);

// module.exports = router;


const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
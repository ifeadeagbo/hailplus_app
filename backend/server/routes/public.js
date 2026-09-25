const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { passwordResetLimiter } = require('../middleware/rateLimiter');
const { validatePasswordResetRequest, validatePasswordReset } = require('../utils/validators');

// Public routes (no authentication required)
router.post('/password-reset', passwordResetLimiter, validatePasswordResetRequest, userController.requestPasswordReset);
router.post('/password-reset/:token', passwordResetLimiter, validatePasswordReset, userController.resetPassword);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Public routes (no authentication required)
router.post('/password-reset', userController.requestPasswordReset);
router.post('/password-reset/:token', userController.resetPassword);

module.exports = router;
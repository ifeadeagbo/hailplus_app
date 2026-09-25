const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const { validateChangePassword } = require('../utils/validators');

// User routes (authenticated)
router.use(authenticate);

router.put('/change-password', validateChangePassword, userController.changePassword);

// Admin only routes
router.get('/', isAdmin, userController.getUsers);
router.get('/:id', isAdmin, userController.getUserById);
router.put('/:id', isAdmin, userController.updateUser);
router.delete('/:id', isAdmin, userController.deleteUser);
router.put('/:id/role', isAdmin, userController.updateUserRole);

module.exports = router;
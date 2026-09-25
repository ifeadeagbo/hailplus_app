const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const { validateChangePassword, validateUUID } = require('../utils/validators');

// User routes (authenticated)
router.use(authenticate);

router.put('/change-password', validateChangePassword, userController.changePassword);

// Admin only routes
router.get('/', isAdmin, userController.getUsers);
router.get('/:id', isAdmin, validateUUID('id'), userController.getUserById);
router.put('/:id', isAdmin, validateUUID('id'), userController.updateUser);
router.delete('/:id', isAdmin, validateUUID('id'), userController.deleteUser);
router.put('/:id/role', isAdmin, validateUUID('id'), userController.updateUserRole);

module.exports = router;
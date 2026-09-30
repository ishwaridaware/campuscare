/**
 * CAMPUS CARE - Authentication Routes
 * Defines auth-related endpoints (/api/register, /api/login)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User Registration
router.post('/register', authController.register);

// User Login
router.post('/login', authController.login);

// Helper endpoints for user profiles / testing
router.get('/users', authController.getUsers);
router.get('/profile/:id', authController.getProfile);

module.exports = router;

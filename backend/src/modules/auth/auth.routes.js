'use strict';
const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { authLimiter } = require('../../middleware/rateLimiter');
const { authenticate } = require('../../middleware/auth');

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/google', authLimiter, controller.loginWithGoogle);
router.post('/refresh', authLimiter, controller.refreshToken);
router.post('/logout', authenticate, controller.logout);
router.get('/verify-email/:token', controller.verifyEmail);
router.post('/forgot-password', authLimiter, controller.forgotPassword);
router.post('/reset-password', authLimiter, controller.resetPassword);
router.get('/me', authenticate, controller.getMe);
router.put('/me', authenticate, controller.updateMe);
router.post('/mfa/enable', authenticate, controller.enableMFA);
router.post('/mfa/verify', authenticate, controller.verifyMFA);
router.delete('/mfa', authenticate, controller.disableMFA);

module.exports = router;

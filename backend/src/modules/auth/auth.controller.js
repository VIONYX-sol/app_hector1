'use strict';
const service = require('./auth.service');
const { pool } = require('../../config/database');

const register = async (req, res, next) => {
  try {
    const data = await service.register(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const data = await service.login(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const loginWithGoogle = async (req, res, next) => {
  try { res.json({ success: true, message: 'Google OAuth not configured' }); } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });
    const data = await service.refreshToken(refreshToken);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET refresh_token_hash=NULL WHERE id=$1', [req.user.id]);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

const verifyEmail = async (req, res, next) => {
  try {
    const data = await service.verifyEmail(req.params.token);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await service.forgotPassword(req.body.email);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const data = await service.resetPassword(token, password);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id,email,first_name,last_name,role,mfa_enabled,email_verified,avatar_url,language,timezone FROM users WHERE id=$1', [req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, language, timezone } = req.body;
    const result = await pool.query(
      'UPDATE users SET first_name=$1,last_name=$2,phone=$3,language=$4,timezone=$5,updated_at=NOW() WHERE id=$6 RETURNING id,email,first_name,last_name,role',
      [firstName, lastName, phone, language, timezone, req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

const enableMFA = async (req, res, next) => {
  try {
    const data = await service.enableMFA(req.user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const verifyMFA = async (req, res, next) => {
  try {
    const data = await service.verifyMFA(req.user.id, req.body.token);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const disableMFA = async (req, res, next) => {
  try {
    const data = await service.disableMFA(req.user.id, req.body.token);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { register, login, loginWithGoogle, refreshToken, logout, verifyEmail, forgotPassword, resetPassword, getMe, updateMe, enableMFA, verifyMFA, disableMFA };

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { dbAsync } = require('../db');

const router = express.Router();

// ============================================================
//  Rate limiting helpers (in-memory, per-process)
// ============================================================
const loginAttempts = new Map();   // ip -> { count, resetAt }
const otpSendAttempts = new Map(); // email -> { count, resetAt }

const WINDOW_MS = 15 * 60 * 1000; // 15 min window
const MAX_LOGIN_ATTEMPTS = 10;     // per IP per window
const MAX_OTP_RESEND = 5;          // per email per window
const MAX_OTP_VERIFY_ATTEMPTS = 5; // per OTP record

function checkRateLimit(map, key, max) {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false; // not limited
  }
  entry.count += 1;
  if (entry.count > max) return true; // limited
  return false;
}

// ============================================================
//  OTP helpers
// ============================================================
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

/**
 * Generate a cryptographically secure 4-digit OTP.
 * Returns the plaintext OTP (never stored) and its bcrypt hash.
 */
async function generateOTP() {
  // randomInt(min, max) is [min, max) — use 10000 so 9999 is reachable
  const raw = crypto.randomInt(1000, 10000).toString();
  const hash = await bcrypt.hash(raw, 10);
  return { raw, hash };
}

/**
 * Send OTP email via nodemailer if SMTP credentials are configured.
 * Supports EMAIL_FROM (per spec) and SMTP_FROM (legacy alias).
 * Throws on delivery failure — callers must handle this and return
 * a real error; never pretend the OTP was delivered when it was not.
 */
async function sendOTPEmail(email, otp) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // Support both EMAIL_FROM (per spec) and SMTP_FROM (legacy alias)
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || user;

  if (host && user && pass) {
    // Production path: real SMTP email delivery
    const nodemailer = require('nodemailer');

    // BUG FIX: Add explicit timeouts so a slow/hung second SMTP connection
    // fails fast instead of silently blocking the login route indefinitely.
    // pool:false ensures every call opens a fresh connection (default, but explicit).
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      pool: false,              // never reuse connections across calls
      connectionTimeout: 10000, // 10 s to establish TCP + TLS
      greetingTimeout:   10000, // 10 s for server EHLO greeting
      socketTimeout:     15000  // 15 s idle-socket cutoff during DATA
    });

    let info;
    try {
      // Will throw if SMTP fails — propagated to caller
      info = await transporter.sendMail({
        from: `"Smart Placement Preparation System" <${from}>`,
        to: email,
        subject: 'Your OTP Verification Code — PrepSmart',
        text: `Your OTP code is: ${otp}\n\nThis code expires in 5 minutes.\nDo not share this code with anyone.\n\nIf you did not request this, please ignore this email.`,
        html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:32px;border-radius:16px;">
          <h2 style="color:#6366f1;margin-bottom:8px;">Smart Placement Preparation System</h2>
          <p style="color:#94a3b8;margin-bottom:24px;">Your verification code is below. It expires in <strong>5 minutes</strong>.</p>
          <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:800;color:#f8fafc;font-family:monospace;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:12px;margin-top:24px;">Do not share this code with anyone. If you did not request this, ignore this email.</p>
        </div>
      `
      });
    } finally {
      // Always release the socket — prevents ghost connections blocking
      // the next login attempt on the same SMTP account.
      transporter.close();
    }

    console.log(`[OTP] Email accepted by SMTP server (id=${info?.messageId ?? 'unknown'}) → ${email}`);
  } else {
    // Development fallback: print to server console ONLY — never leak to response
    console.log(`\n========================================`);
    console.log(`[OTP DEV MODE] SMTP not configured — OTP printed to console only`);
    console.log(`[OTP DEV MODE] Recipient : ${email}`);
    console.log(`[OTP DEV MODE] Code      : ${otp}`);
    console.log(`[OTP DEV MODE] Expires   : ${new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString()}`);
    console.log(`[OTP DEV MODE] To enable real email, set SMTP_HOST, SMTP_USER, SMTP_PASS in .env`);
    console.log(`========================================\n`);
  }
}

// ============================================================
//  POST /api/auth/register
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, targetRole, experienceLevel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }

    const existingUser = await dbAsync.get('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    // Check per-email OTP send rate limit before creating the account
    if (checkRateLimit(otpSendAttempts, trimmedEmail, MAX_OTP_RESEND)) {
      return res.status(429).json({ success: false, error: 'Too many OTP requests for this email. Please wait 15 minutes.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const role = targetRole || 'Full Stack Developer';
    const exp = experienceLevel || 'Entry Level';

    const result = await dbAsync.run(
      `INSERT INTO users (name, email, password_hash, target_role, experience_level) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), trimmedEmail, passwordHash, role, exp]
    );
    const userId = result.id;

    await dbAsync.run(
      `INSERT INTO student_stats (user_id, readiness_score, interviews_completed, practice_hours, topics_mastered) VALUES (?, ?, ?, ?, ?)`,
      [userId, 65, 0, 0.0, 0]
    );

    // Generate and send OTP — do NOT create an authenticated session yet
    const { raw, hash } = await generateOTP();
    const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_SECONDS;

    await dbAsync.run(
      `INSERT INTO otp_verifications (email, otp_hash, expires_at, resend_count, last_resend_at)
       VALUES (?, ?, ?, 0, strftime('%s','now'))`,
      [trimmedEmail, hash, expiresAt]
    );

    try {
      await sendOTPEmail(trimmedEmail, raw);
    } catch (mailErr) {
      console.error('[OTP] Registration email delivery FAILED:', mailErr.message);
      // Invalidate the OTP so it can't be used
      await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE email = ? AND used = 0`, [trimmedEmail]);
      return res.status(500).json({
        success: false,
        error: 'Account created but failed to send verification email. Please contact support or try logging in to resend.'
      });
    }

    // Store only the pending email — NOT the user ID — until OTP is verified
    req.session.otpPendingEmail = trimmedEmail;

    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const maskedEmail = trimmedEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 4)) + c);

    return res.status(201).json({
      success: true,
      otpRequired: true,
      message: isSmtpConfigured
        ? 'Account created! A 4-digit verification code has been sent to your email.'
        : 'Account created! OTP generated (dev mode — check the server console for the code).',
      maskedEmail,
      devMode: !isSmtpConfigured
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error during registration.' });
  }
});

// ============================================================
//  POST /api/auth/login
//
//  Step 1 of the mandatory 2FA login flow:
//    1. Validate email + password against the database.
//    2. On credential match: generate OTP, send to email, store only the hash.
//    3. DO NOT create an authenticated session yet.
//    4. Respond with { otpRequired: true, maskedEmail, devMode }.
//    5. The client shows the OTP panel.
//    6. Session is created ONLY after /otp/verify succeeds.
// ============================================================
router.post('/login', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (checkRateLimit(loginAttempts, ip, MAX_LOGIN_ATTEMPTS)) {
    return res.status(429).json({ success: false, error: 'Too many login attempts. Please wait 15 minutes and try again.' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await dbAsync.get('SELECT * FROM users WHERE email = ?', [trimmedEmail]);

    // Use constant-time compare to prevent user enumeration via timing
    const dummyHash = '$2a$10$invalidhashforcomparison1234567890abcdefghijk';
    const isMatch = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // ---- Credentials verified — now start the OTP flow ----

    // Check per-email OTP send rate limit
    if (checkRateLimit(otpSendAttempts, trimmedEmail, MAX_OTP_RESEND)) {
      return res.status(429).json({ success: false, error: 'Too many OTP requests for this account. Please wait 15 minutes.' });
    }

    // Invalidate any existing unused OTPs for this user
    await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE email = ? AND used = 0`, [trimmedEmail]);

    const { raw, hash } = await generateOTP();
    const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_SECONDS;

    await dbAsync.run(
      `INSERT INTO otp_verifications (email, otp_hash, expires_at, resend_count, last_resend_at)
       VALUES (?, ?, ?, 0, strftime('%s','now'))`,
      [trimmedEmail, hash, expiresAt]
    );

    // Attempt email delivery — if it fails, invalidate the OTP and report the real error
    try {
      await sendOTPEmail(trimmedEmail, raw);
    } catch (mailErr) {
      console.error('[OTP] Email delivery FAILED:', mailErr.message);
      await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE email = ? AND used = 0`, [trimmedEmail]);
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email. Please check your SMTP configuration or try again later.'
      });
    }

    // Store only the pending email in session — NOT the OTP, NOT the user ID
    req.session.otpPendingEmail = trimmedEmail;

    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const maskedEmail = trimmedEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 4)) + c);

    return res.json({
      success: true,
      otpRequired: true,
      message: isSmtpConfigured
        ? 'A 4-digit verification code has been sent to your email.'
        : 'OTP generated (dev mode — check the server console for the code).',
      maskedEmail,
      devMode: !isSmtpConfigured
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// ============================================================
//  POST /api/auth/otp/resend
//  Resend OTP for an active login session.
// ============================================================
router.post('/otp/resend', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });
    const trimmedEmail = email.trim().toLowerCase();

    // Rate limit resend attempts
    if (checkRateLimit(otpSendAttempts, trimmedEmail + '_resend', MAX_OTP_RESEND)) {
      return res.status(429).json({ success: false, error: 'Too many resend attempts. Please wait 15 minutes.' });
    }

    // Verify user exists before proceeding (no enumeration: respond identically if not found)
    const user = await dbAsync.get('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, an OTP has been resent.' });
    }

    // Server-side cooldown: enforce 60s between resends
    const lastOtp = await dbAsync.get(
      `SELECT last_resend_at, resend_count FROM otp_verifications WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1`,
      [trimmedEmail]
    );
    if (lastOtp && lastOtp.last_resend_at) {
      const secondsSince = Math.floor(Date.now() / 1000) - lastOtp.last_resend_at;
      if (secondsSince < 60) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${60 - secondsSince} seconds before requesting a new OTP.`,
          waitSeconds: 60 - secondsSince
        });
      }
    }

    // Invalidate previous OTPs
    await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE email = ? AND used = 0`, [trimmedEmail]);

    const { raw, hash } = await generateOTP();
    const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_SECONDS;

    await dbAsync.run(
      `INSERT INTO otp_verifications (email, otp_hash, expires_at, resend_count, last_resend_at)
       VALUES (?, ?, ?, ?, strftime('%s','now'))`,
      [trimmedEmail, hash, expiresAt, (lastOtp ? lastOtp.resend_count + 1 : 1)]
    );

    try {
      await sendOTPEmail(trimmedEmail, raw);
    } catch (mailErr) {
      console.error('[OTP] Resend email FAILED:', mailErr.message);
      await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE email = ? AND used = 0`, [trimmedEmail]);
      return res.status(500).json({
        success: false,
        error: 'Failed to resend OTP email. Please check SMTP configuration.'
      });
    }

    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    return res.json({ success: true, message: 'OTP resent successfully.', devMode: !isSmtpConfigured });

  } catch (error) {
    console.error('OTP Resend Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to resend OTP.' });
  }
});

// ============================================================
//  POST /api/auth/otp/verify
//  Step 2 of the 2FA login flow: verify OTP and create session.
// ============================================================
router.post('/otp/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOTP = String(otp).trim();

    if (!/^\d{4}$/.test(trimmedOTP)) {
      return res.status(400).json({ success: false, error: 'OTP must be exactly 4 digits.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const record = await dbAsync.get(
      `SELECT * FROM otp_verifications WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1`,
      [trimmedEmail]
    );

    if (!record) {
      return res.status(401).json({ success: false, error: 'No active OTP found. Please request a new one.' });
    }

    // Check expiry
    if (now > record.expires_at) {
      await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE id = ?`, [record.id]);
      return res.status(401).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempt limit before incrementing
    if (record.attempt_count >= MAX_OTP_VERIFY_ATTEMPTS) {
      await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE id = ?`, [record.id]);
      return res.status(429).json({ success: false, error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Increment attempt count before the comparison (prevents race-condition bypasses)
    await dbAsync.run(`UPDATE otp_verifications SET attempt_count = attempt_count + 1 WHERE id = ?`, [record.id]);

    // Constant-time compare via bcrypt
    const isMatch = await bcrypt.compare(trimmedOTP, record.otp_hash);
    if (!isMatch) {
      const remaining = MAX_OTP_VERIFY_ATTEMPTS - (record.attempt_count + 1);
      return res.status(401).json({
        success: false,
        error: `Incorrect OTP.${remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : ' No attempts remaining. Please request a new OTP.'}`
      });
    }

    // Mark OTP as used — single-use enforcement
    await dbAsync.run(`UPDATE otp_verifications SET used = 1 WHERE id = ?`, [record.id]);

    // Fetch user and establish the authenticated session ONLY NOW
    const user = await dbAsync.get(
      'SELECT id, name, email, target_role, experience_level, is_admin FROM users WHERE email = ?',
      [trimmedEmail]
    );
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    req.session.regenerate((err) => {
      if (err) console.error('Session regeneration error:', err);
      req.session.userId = user.id;
      req.session.otpVerified = true;
      delete req.session.otpPendingEmail;
      return res.json({
        success: true,
        message: 'OTP verified successfully!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          target_role: user.target_role,
          experience_level: user.experience_level,
          is_admin: user.is_admin || 0
        }
      });
    });

  } catch (error) {
    console.error('OTP Verify Error:', error);
    return res.status(500).json({ success: false, error: 'Server error during OTP verification.' });
  }
});

// ============================================================
//  POST /api/auth/logout
// ============================================================
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Could not log out.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// ============================================================
//  GET /api/auth/me
// ============================================================
router.get('/me', async (req, res) => {
  try {
    // Both userId AND otpVerified must be present for a fully authenticated session
    if (!req.session || !req.session.userId || !req.session.otpVerified) {
      return res.json({ success: true, user: null });
    }
    const user = await dbAsync.get(
      'SELECT id, name, email, target_role, experience_level, is_admin, created_at, theme_mode, accent_color, language, avatar_color, photo_url FROM users WHERE id = ?',
      [req.session.userId]
    );
    if (!user) {
      req.session.destroy();
      return res.json({ success: true, user: null });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Check Session Error:', error);
    return res.status(500).json({ success: false, error: 'Error validating session.' });
  }
});

module.exports = router;

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { dbAsync } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Photo Upload Setup
const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${req.session.userId}_${Date.now()}${ext}`);
  }
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
});

// GET /api/preferences
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await dbAsync.get(
      'SELECT theme_mode, accent_color, language, avatar_color, photo_url FROM users WHERE id = ?',
      [req.session.userId]
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    return res.json({ success: true, preferences: user });
  } catch (err) {
    console.error('Preferences GET error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load preferences.' });
  }
});

// POST /api/preferences
const VALID_THEMES  = ['dark', 'light'];
const VALID_ACCENTS = ['indigo', 'emerald', 'purple', 'amber', 'cyan'];
const VALID_LANGS   = ['en','ta','hi','te','ml','kn','bn','mr','es','fr','de','ja','zh','ar','pt'];
const VALID_COLORS  = ['blue','emerald','purple','amber','rose'];

router.post('/', requireAuth, async (req, res) => {
  try {
    const { theme_mode, accent_color, language, avatar_color } = req.body;
    const updates = {};
    if (theme_mode !== undefined) {
      if (!VALID_THEMES.includes(theme_mode)) return res.status(400).json({ success: false, error: 'Invalid theme mode.' });
      updates.theme_mode = theme_mode;
    }
    if (accent_color !== undefined) {
      if (!VALID_ACCENTS.includes(accent_color)) return res.status(400).json({ success: false, error: 'Invalid accent color.' });
      updates.accent_color = accent_color;
    }
    if (language !== undefined) {
      if (!VALID_LANGS.includes(language)) return res.status(400).json({ success: false, error: 'Invalid language code.' });
      updates.language = language;
    }
    if (avatar_color !== undefined) {
      if (!VALID_COLORS.includes(avatar_color)) return res.status(400).json({ success: false, error: 'Invalid avatar color.' });
      updates.avatar_color = avatar_color;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid preferences provided.' });
    }
    const setClauses = Object.keys(updates).map(k => k + ' = ?').join(', ');
    const values = [...Object.values(updates), req.session.userId];
    await dbAsync.run('UPDATE users SET ' + setClauses + ' WHERE id = ?', values);
    return res.json({ success: true, message: 'Preferences saved.', preferences: updates });
  } catch (err) {
    console.error('Preferences POST error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save preferences.' });
  }
});

// POST /api/preferences/photo
router.post('/photo', requireAuth, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be under 5 MB.' : (err.message || 'Upload failed.');
      return res.status(400).json({ success: false, error: msg });
    }
    if (!req.file) return res.status(400).json({ success: false, error: 'No photo file provided.' });
    try {
      const existing = await dbAsync.get('SELECT photo_url FROM users WHERE id = ?', [req.session.userId]);
      if (existing && existing.photo_url) {
        const oldFile = path.join(__dirname, '..', '..', existing.photo_url.replace(/^\//, ''));
        if (fs.existsSync(oldFile)) fs.unlink(oldFile, () => {});
      }
      const publicUrl = '/uploads/avatars/' + req.file.filename;
      await dbAsync.run('UPDATE users SET photo_url = ? WHERE id = ?', [publicUrl, req.session.userId]);
      return res.json({ success: true, photo_url: publicUrl, message: 'Profile photo updated.' });
    } catch (dbErr) {
      console.error('Photo upload DB error:', dbErr);
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(500).json({ success: false, error: 'Failed to save photo.' });
    }
  });
});

// DELETE /api/preferences/photo
router.delete('/photo', requireAuth, async (req, res) => {
  try {
    const user = await dbAsync.get('SELECT photo_url FROM users WHERE id = ?', [req.session.userId]);
    if (user && user.photo_url) {
      const filePath = path.join(__dirname, '..', '..', user.photo_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }
    await dbAsync.run('UPDATE users SET photo_url = NULL WHERE id = ?', [req.session.userId]);
    return res.json({ success: true, message: 'Profile photo removed.' });
  } catch (err) {
    console.error('Photo delete error:', err);
    return res.status(500).json({ success: false, error: 'Failed to remove photo.' });
  }
});

module.exports = router;

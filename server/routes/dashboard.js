const express = require('express');
const { dbAsync } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET Student Dashboard Summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await dbAsync.get(
      'SELECT id, name, email, target_role, experience_level, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    let stats = await dbAsync.get(
      'SELECT readiness_score, interviews_completed, practice_hours, topics_mastered, last_practice_date FROM student_stats WHERE user_id = ?',
      [userId]
    );

    if (!stats) {
      stats = {
        readiness_score: 65,
        interviews_completed: 0,
        practice_hours: 0.0,
        topics_mastered: 0,
        last_practice_date: new Date().toISOString()
      };
    }

    // Fetch live attempt records from database tables safely
    let aptitudeAttempts = [];
    let codingAttempts = [];
    let technicalAttempts = [];

    try {
      aptitudeAttempts = await dbAsync.all('SELECT percentage FROM aptitude_attempts WHERE user_id = ?', [userId]) || [];
    } catch (e) { aptitudeAttempts = []; }

    try {
      codingAttempts = await dbAsync.all('SELECT status FROM coding_attempts WHERE user_id = ?', [userId]) || [];
    } catch (e) { codingAttempts = []; }

    try {
      technicalAttempts = await dbAsync.all('SELECT percentage FROM technical_attempts WHERE user_id = ?', [userId]) || [];
    } catch (e) { technicalAttempts = []; }

    const totalSessions = aptitudeAttempts.length + codingAttempts.length + technicalAttempts.length;

    let totalPctSum = 0;
    let scoredCount = 0;

    aptitudeAttempts.forEach(a => { if (typeof a.percentage === 'number') { totalPctSum += a.percentage; scoredCount++; } });
    technicalAttempts.forEach(t => { if (typeof t.percentage === 'number') { totalPctSum += t.percentage; scoredCount++; } });
    codingAttempts.forEach(c => {
      totalPctSum += (c.status === 'Accepted' ? 100 : 30);
      scoredCount++;
    });

    let liveReadiness = stats.readiness_score || 65;
    if (scoredCount > 0) {
      liveReadiness = Math.min(98, Math.max(50, Math.round(totalPctSum / scoredCount)));
    }

    const liveHours = Math.round(((stats.practice_hours || 0) + totalSessions * 0.4) * 10) / 10;
    const liveTopics = Math.min(12, (stats.topics_mastered || 0) + (totalSessions > 0 ? Math.min(6, totalSessions) : 0));
    const liveInterviews = (stats.interviews_completed || 0) + totalSessions;

    const dynamicStats = {
      readiness_score: liveReadiness,
      interviews_completed: liveInterviews,
      practice_hours: liveHours,
      topics_mastered: liveTopics,
      last_practice_date: stats.last_practice_date || new Date().toISOString()
    };

    // Recommended topics based on user's target role
    const practiceTopics = [
      { id: 1, title: 'Data Structures & Algorithms', category: 'Technical', progress: 75, totalQuestions: 40, status: 'In Progress' },
      { id: 2, title: 'System Design & Architecture', category: 'Technical', progress: 40, totalQuestions: 25, status: 'In Progress' },
      { id: 3, title: 'Behavioral & STAR Method', category: 'HR / Soft Skills', progress: 90, totalQuestions: 15, status: 'Mastered' },
      { id: 4, title: 'Web Fundamentals & APIs', category: 'Technical', progress: 60, totalQuestions: 30, status: 'In Progress' }
    ];

    // Upcoming mock interviews schedule
    const upcomingSchedule = [
      { id: 101, title: 'Mock System Design Interview', date: 'Tomorrow, 10:00 AM', interviewer: 'AI Coach (Upcoming)', type: 'Technical' },
      { id: 102, title: 'Behavioral Readiness Assessment', date: 'Friday, 2:30 PM', interviewer: 'Peer Review', type: 'HR' }
    ];

    return res.json({
      success: true,
      data: {
        user,
        stats: dynamicStats,
        practiceTopics,
        upcomingSchedule
      }
    });

  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve dashboard summary.' });
  }
});

// Update Profile Target Role / Experience Level / Name
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { targetRole, experienceLevel, name } = req.body;

    if (!targetRole || !experienceLevel) {
      return res.status(400).json({ success: false, error: 'Target role and experience level are required.' });
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
      }
      await dbAsync.run(
        'UPDATE users SET target_role = ?, experience_level = ?, name = ? WHERE id = ?',
        [targetRole, experienceLevel, trimmedName, userId]
      );
    } else {
      await dbAsync.run(
        'UPDATE users SET target_role = ?, experience_level = ? WHERE id = ?',
        [targetRole, experienceLevel, userId]
      );
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      updatedProfile: { targetRole, experienceLevel, name }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

module.exports = router;

const express = require('express');
const { dbAsync } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply requireAuth and requireAdmin to all admin endpoints
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Platform Statistics Overview
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsersRow = await dbAsync.get('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersRow ? totalUsersRow.count : 0;

    const activeUsersRow = await dbAsync.get(`
      SELECT COUNT(DISTINCT user_id) as count FROM (
        SELECT user_id FROM aptitude_attempts
        UNION SELECT user_id FROM coding_attempts
        UNION SELECT user_id FROM technical_attempts
        UNION SELECT user_id FROM mock_interviews
      )
    `);
    const activeUsers = activeUsersRow ? activeUsersRow.count : 0;

    const aptitudeRow = await dbAsync.get('SELECT COUNT(*) as count, AVG(percentage) as avg_score FROM aptitude_attempts');
    const codingRow = await dbAsync.get(`
      SELECT COUNT(*) as count,
             AVG(CASE WHEN status = 'Accepted' THEN 100 ELSE 30 END) as avg_score
      FROM coding_attempts
    `);
    const techRow = await dbAsync.get('SELECT COUNT(*) as count, AVG(percentage) as avg_score FROM technical_attempts');
    const mockRow = await dbAsync.get('SELECT COUNT(*) as count, AVG(final_score) as avg_score FROM mock_interviews');

    const aptitudeAttempts = aptitudeRow ? aptitudeRow.count : 0;
    const codingAttempts = codingRow ? codingRow.count : 0;
    const technicalAttempts = techRow ? techRow.count : 0;
    const mockAttempts = mockRow ? mockRow.count : 0;

    // Calculate Overall Average Performance across all attempt types
    const scores = [];
    if (aptitudeRow && aptitudeRow.avg_score !== null) scores.push(aptitudeRow.avg_score);
    if (codingRow && codingRow.avg_score !== null) scores.push(codingRow.avg_score);
    if (techRow && techRow.avg_score !== null) scores.push(techRow.avg_score);
    if (mockRow && mockRow.avg_score !== null) scores.push(mockRow.avg_score);

    let avgPerformance = 0;
    if (scores.length > 0) {
      avgPerformance = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        aptitudeAttempts,
        codingAttempts,
        technicalAttempts,
        mockAttempts,
        avgPerformance
      }
    });

  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve admin platform statistics.' });
  }
});

/**
 * GET /api/admin/users
 * User Management List with attempt counts and readiness
 */
router.get('/users', async (req, res) => {
  try {
    const users = await dbAsync.all(
      'SELECT id, name, email, target_role, experience_level, is_admin, created_at FROM users ORDER BY id DESC'
    );

    const enrichedUsers = await Promise.all(users.map(async (u) => {
      const aptRow = await dbAsync.get('SELECT COUNT(*) as cnt FROM aptitude_attempts WHERE user_id = ?', [u.id]);
      const codRow = await dbAsync.get('SELECT COUNT(*) as cnt FROM coding_attempts WHERE user_id = ?', [u.id]);
      const techRow = await dbAsync.get('SELECT COUNT(*) as cnt FROM technical_attempts WHERE user_id = ?', [u.id]);
      const mockRow = await dbAsync.get('SELECT COUNT(*) as cnt FROM mock_interviews WHERE user_id = ?', [u.id]);
      const statsRow = await dbAsync.get('SELECT readiness_score FROM student_stats WHERE user_id = ?', [u.id]);

      const totalAttempts = (aptRow ? aptRow.cnt : 0) + (codRow ? codRow.cnt : 0) + (techRow ? techRow.cnt : 0) + (mockRow ? mockRow.cnt : 0);

      return {
        ...u,
        readinessScore: statsRow ? statsRow.readiness_score : 65,
        totalAttempts,
        aptitudeAttempts: aptRow ? aptRow.cnt : 0,
        codingAttempts: codRow ? codRow.cnt : 0,
        technicalAttempts: techRow ? techRow.cnt : 0,
        mockAttempts: mockRow ? mockRow.cnt : 0
      };
    }));

    return res.json({
      success: true,
      users: enrichedUsers
    });

  } catch (error) {
    console.error('Admin Users Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user list.' });
  }
});

/**
 * GET /api/admin/questions/:module
 * Question Management List for specified module (aptitude, coding, technical)
 */
router.get('/questions/:module', async (req, res) => {
  try {
    const { module } = req.params;

    let questions = [];
    if (module === 'aptitude') {
      questions = await dbAsync.all('SELECT * FROM questions ORDER BY id DESC');
    } else if (module === 'coding') {
      questions = await dbAsync.all('SELECT * FROM coding_questions ORDER BY id DESC');
    } else if (module === 'technical') {
      questions = await dbAsync.all('SELECT * FROM technical_questions ORDER BY id DESC');
    } else {
      return res.status(400).json({ success: false, error: 'Invalid module specified.' });
    }

    return res.json({
      success: true,
      module,
      questions
    });

  } catch (error) {
    console.error('Admin Fetch Questions Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch questions.' });
  }
});

/**
 * POST /api/admin/questions/:module
 * Create new question for specified module
 */
router.post('/questions/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const data = req.body;

    if (module === 'aptitude') {
      const { question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty } = data;
      if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
        return res.status(400).json({ success: false, error: 'Missing required fields for Aptitude question.' });
      }

      const result = await dbAsync.run(
        `INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [question, option_a, option_b, option_c, option_d, correct_answer, explanation || '', category || 'Quantitative Aptitude', difficulty || 'Easy']
      );

      return res.json({ success: true, message: 'Aptitude question created successfully.', id: result.id });

    } else if (module === 'coding') {
      const { title, description, difficulty, category, example_input, example_output, starter_code, test_cases } = data;
      if (!title || !description || !example_input || !example_output || !starter_code) {
        return res.status(400).json({ success: false, error: 'Missing required fields for Coding question.' });
      }

      let testCasesStr = typeof test_cases === 'string' ? test_cases : JSON.stringify(test_cases || []);

      const result = await dbAsync.run(
        `INSERT INTO coding_questions (title, description, difficulty, category, example_input, example_output, starter_code, test_cases)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, difficulty || 'Easy', category || 'Algorithms', example_input, example_output, starter_code, testCasesStr]
      );

      return res.json({ success: true, message: 'Coding question created successfully.', id: result.id });

    } else if (module === 'technical') {
      const { question, option_a, option_b, option_c, option_d, answer, explanation, category, difficulty } = data;
      if (!question || !option_a || !option_b || !option_c || !option_d || !answer) {
        return res.status(400).json({ success: false, error: 'Missing required fields for Technical question.' });
      }

      const result = await dbAsync.run(
        `INSERT INTO technical_questions (question, option_a, option_b, option_c, option_d, answer, explanation, category, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [question, option_a, option_b, option_c, option_d, answer, explanation || '', category || 'Python', difficulty || 'Easy']
      );

      return res.json({ success: true, message: 'Technical question created successfully.', id: result.id });

    } else {
      return res.status(400).json({ success: false, error: 'Invalid module specified.' });
    }

  } catch (error) {
    console.error('Admin Create Question Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create question.' });
  }
});

/**
 * DELETE /api/admin/questions/:module/:id
 * Delete a question by ID
 */
router.delete('/questions/:module/:id', async (req, res) => {
  try {
    const { module, id } = req.params;

    let tableName = '';
    if (module === 'aptitude') tableName = 'questions';
    else if (module === 'coding') tableName = 'coding_questions';
    else if (module === 'technical') tableName = 'technical_questions';
    else return res.status(400).json({ success: false, error: 'Invalid module specified.' });

    await dbAsync.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

    return res.json({ success: true, message: 'Question deleted successfully.' });

  } catch (error) {
    console.error('Admin Delete Question Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete question.' });
  }
});

/**
 * PUT /api/admin/questions/:module/:id
 * Update an existing question by ID
 */
router.put('/questions/:module/:id', async (req, res) => {
  try {
    const { module, id } = req.params;
    const data = req.body;

    if (module === 'aptitude') {
      const { question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty } = data;
      if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
        return res.status(400).json({ success: false, error: 'Missing required fields for Aptitude question.' });
      }

      await dbAsync.run(
        `UPDATE questions 
         SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, explanation = ?, category = ?, difficulty = ?
         WHERE id = ?`,
        [question, option_a, option_b, option_c, option_d, correct_answer, explanation || '', category || 'Quantitative Aptitude', difficulty || 'Easy', id]
      );

      return res.json({ success: true, message: 'Aptitude question updated successfully.' });

    } else if (module === 'coding') {
      const { title, description, difficulty, category, example_input, example_output, starter_code, test_cases } = data;
      if (!title || !description || !example_input || !example_output || !starter_code) {
        return res.status(400).json({ success: false, error: 'Missing required fields for Coding question.' });
      }

      let testCasesStr = typeof test_cases === 'string' ? test_cases : JSON.stringify(test_cases || []);

      await dbAsync.run(
        `UPDATE coding_questions 
         SET title = ?, description = ?, difficulty = ?, category = ?, example_input = ?, example_output = ?, starter_code = ?, test_cases = ?
         WHERE id = ?`,
        [title, description, difficulty || 'Easy', category || 'Algorithms', example_input, example_output, starter_code, testCasesStr, id]
      );

      return res.json({ success: true, message: 'Coding question updated successfully.' });

    } else if (module === 'technical') {
      const { question, option_a, option_b, option_c, option_d, answer, explanation, category, difficulty } = data;
      if (!question || !option_a || !option_b || !option_c || !option_d || !answer) {
        return res.status(400).json({ success: false, error: 'Missing required fields for Technical question.' });
      }

      await dbAsync.run(
        `UPDATE technical_questions 
         SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, answer = ?, explanation = ?, category = ?, difficulty = ?
         WHERE id = ?`,
        [question, option_a, option_b, option_c, option_d, answer, explanation || '', category || 'Python', difficulty || 'Easy', id]
      );

      return res.json({ success: true, message: 'Technical question updated successfully.' });

    } else {
      return res.status(400).json({ success: false, error: 'Invalid module specified.' });
    }

  } catch (error) {
    console.error('Admin Update Question Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update question.' });
  }
});

/**
 * PUT /api/admin/users/:id/toggle-admin
 * Promote or demote user admin privileges
 */
router.put('/users/:id/toggle-admin', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent demoting self
    if (parseInt(id, 10) === req.session.userId) {
      return res.status(400).json({ success: false, error: 'You cannot revoke your own admin status.' });
    }

    const user = await dbAsync.get('SELECT is_admin FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const newAdminStatus = user.is_admin === 1 ? 0 : 1;
    await dbAsync.run('UPDATE users SET is_admin = ? WHERE id = ?', [newAdminStatus, id]);

    return res.json({
      success: true,
      message: `User admin status updated to ${newAdminStatus === 1 ? 'Admin' : 'Student'}.`,
      is_admin: newAdminStatus
    });

  } catch (error) {
    console.error('Admin Toggle User Role Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update user admin role.' });
  }
});

/**
 * GET /api/admin/users/:id/progress
 * Detailed progress breakdown for a specific user
 */
router.get('/users/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await dbAsync.get('SELECT id, name, email, target_role, experience_level, created_at FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const stats = await dbAsync.get('SELECT * FROM student_stats WHERE user_id = ?', [id]);
    const aptAttempts = await dbAsync.all('SELECT * FROM aptitude_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 10', [id]);
    const codingAttempts = await dbAsync.all(`
      SELECT c.*, q.title as question_title 
      FROM coding_attempts c 
      LEFT JOIN coding_questions q ON c.question_id = q.id 
      WHERE c.user_id = ? ORDER BY c.id DESC LIMIT 10
    `, [id]);
    const techAttempts = await dbAsync.all('SELECT * FROM technical_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 10', [id]);
    const mockInterviews = await dbAsync.all('SELECT id, target_role, interview_type, difficulty, final_score, created_at FROM mock_interviews WHERE user_id = ? ORDER BY id DESC LIMIT 10', [id]);

    return res.json({
      success: true,
      user,
      stats: stats || { readiness_score: 65, interviews_completed: 0, practice_hours: 0, topics_mastered: 0 },
      history: {
        aptitude: aptAttempts,
        coding: codingAttempts,
        technical: techAttempts,
        mock: mockInterviews
      }
    });

  } catch (error) {
    console.error('Admin User Progress Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user progress details.' });
  }
});

/**
 * GET /api/admin/sessions
 * Real-time interview & practice session monitoring feed
 */
router.get('/sessions', async (req, res) => {
  try {
    const recentMocks = await dbAsync.all(`
      SELECT m.id, m.user_id, u.name as user_name, u.email as user_email, m.target_role, m.interview_type, m.difficulty, m.final_score, m.created_at
      FROM mock_interviews m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.id DESC LIMIT 15
    `);

    const recentAptitude = await dbAsync.all(`
      SELECT a.id, a.user_id, u.name as user_name, a.category, a.difficulty, a.percentage, a.score, a.total_questions, a.created_at
      FROM aptitude_attempts a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC LIMIT 15
    `);

    const recentCoding = await dbAsync.all(`
      SELECT c.id, c.user_id, u.name as user_name, q.title as question_title, c.status, c.created_at
      FROM coding_attempts c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN coding_questions q ON c.question_id = q.id
      ORDER BY c.id DESC LIMIT 15
    `);

    return res.json({
      success: true,
      sessions: {
        mockInterviews: recentMocks,
        aptitudeAttempts: recentAptitude,
        codingAttempts: recentCoding
      }
    });

  } catch (error) {
    console.error('Admin Sessions Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch session monitoring feed.' });
  }
});

module.exports = router;



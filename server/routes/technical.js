const express = require('express');
const { dbAsync } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getRecommendedDifficulty, pickAdaptiveQuestions, updateSkillProfileFromAttempt } = require('../services/adaptiveEngineService');
const { generateTechnicalFeedback } = require('../services/explainableFeedbackService');

const router = express.Router();

/**
 * GET /api/technical/questions
 * Fetches technical questions filtered by category/technology and difficulty (supports adaptive mode)
 */
router.get('/questions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, difficulty, limit } = req.query;

    const isAdaptive = !difficulty || difficulty.toLowerCase() === 'adaptive' || difficulty === 'Adaptive Difficulty';
    let targetDifficulty = 'Medium';

    let normCategory = category;
    if (normCategory === 'C Language') normCategory = 'C';
    if (normCategory === 'OOP (Object-Oriented)') normCategory = 'OOP';
    if (normCategory === 'HTML / CSS') normCategory = 'HTML/CSS';

    if (isAdaptive) {
      targetDifficulty = await getRecommendedDifficulty(userId, normCategory, 'technical');
    } else if (['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      targetDifficulty = difficulty;
    }

    let sql = 'SELECT id, question, option_a, option_b, option_c, option_d, answer, explanation, category, difficulty FROM technical_questions';
    const params = [];
    const conditions = [];

    if (normCategory && normCategory !== 'All' && normCategory !== 'All Technologies' && normCategory !== 'All Categories') {
      conditions.push('category = ?');
      params.push(normCategory);
    }

    // If explicit fixed difficulty (not adaptive and not All)
    if (!isAdaptive && difficulty && difficulty !== 'All' && difficulty !== 'All Difficulties') {
      conditions.push('difficulty = ?');
      params.push(difficulty);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const questionLimit = parseInt(limit, 10) || 10;
    const rawQuestions = await dbAsync.all(sql, params);

    let questions = rawQuestions;
    if (isAdaptive) {
      questions = pickAdaptiveQuestions(rawQuestions, targetDifficulty, questionLimit);
    } else {
      questions = rawQuestions.sort(() => Math.random() - 0.5).slice(0, questionLimit);
    }

    return res.json({
      success: true,
      count: questions.length,
      adaptedDifficulty: targetDifficulty,
      questions
    });
  } catch (error) {
    console.error('Fetch Technical Questions Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve technical questions.' });
  }
});

/**
 * POST /api/technical/submit
 * Submits technical practice answers, evaluates score against SQLite, persists attempt, and returns breakdown with explanations.
 */
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, difficulty, answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid answers payload.' });
    }

    const questionIds = Object.keys(answers).map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (questionIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid questions submitted.' });
    }

    const placeholders = questionIds.map(() => '?').join(',');
    const dbQuestions = await dbAsync.all(
      `SELECT * FROM technical_questions WHERE id IN (${placeholders})`,
      questionIds
    );

    let correctCount = 0;
    let wrongCount = 0;
    const questionResults = [];

    dbQuestions.forEach(q => {
      const userSelected = answers[q.id] || null;
      let isCorrect = false;

      if (userSelected && userSelected.toLowerCase() === q.answer.toLowerCase()) {
        isCorrect = true;
      }

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      questionResults.push({
        questionId: q.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        selectedOption: userSelected,
        correctAnswer: q.answer,
        isCorrect,
        explanation: q.explanation,
        category: q.category,
        difficulty: q.difficulty
      });
    });

    const totalQuestions = dbQuestions.length;
    const score = correctCount;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100 * 10) / 10 : 0;

    const testCategory = category || 'General Technical';
    const testDifficulty = difficulty || 'Mixed';

    // Store attempt in SQLite
    const attemptResult = await dbAsync.run(
      `INSERT INTO technical_attempts (user_id, category, difficulty, score, total_questions, correct_answers, wrong_answers, percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, testCategory, testDifficulty, score, totalQuestions, correctCount, wrongCount, percentage]
    );

    // Update user stats in student_stats
    const userStats = await dbAsync.get('SELECT * FROM student_stats WHERE user_id = ?', [userId]);
    if (userStats) {
      const newHours = Math.round((userStats.practice_hours + 0.3) * 10) / 10;
      await dbAsync.run(
        'UPDATE student_stats SET practice_hours = ?, last_practice_date = CURRENT_TIMESTAMP WHERE user_id = ?',
        [newHours, userId]
      );
    }

    // Adaptively update Unified Student Skill Profile
    updateSkillProfileFromAttempt(userId, testCategory, percentage, 'technical').catch(e => console.error('Skill profile sync error:', e));

    // Generate Explainable AI Feedback
    const explainableFeedback = generateTechnicalFeedback(questionResults);

    return res.json({
      success: true,
      message: 'Technical practice evaluated and saved successfully.',
      data: {
        attemptId: attemptResult.id,
        category: testCategory,
        difficulty: testDifficulty,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        percentage,
        questionResults,
        explainableFeedback
      }
    });

  } catch (error) {
    console.error('Technical Submit Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to evaluate technical interview practice.' });
  }
});

/**
 * GET /api/technical/history
 * Gets user's past technical interview attempt history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const attempts = await dbAsync.all(
      'SELECT id, category, difficulty, score, total_questions, correct_answers, wrong_answers, percentage, created_at FROM technical_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    return res.json({
      success: true,
      attempts
    });
  } catch (error) {
    console.error('Fetch Technical History Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve technical history.' });
  }
});

module.exports = router;

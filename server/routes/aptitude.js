const express = require('express');
const { dbAsync } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getRecommendedDifficulty, pickAdaptiveQuestions, updateSkillProfileFromAttempt } = require('../services/adaptiveEngineService');
const { generateAptitudeFeedback } = require('../services/explainableFeedbackService');

const router = express.Router();

/**
 * GET /api/aptitude/questions
 * Fetches test questions filtered by category and difficulty (supports adaptive mode)
 */
router.get('/questions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, difficulty, limit } = req.query;

    const isAdaptive = !difficulty || difficulty.toLowerCase() === 'adaptive' || difficulty === 'Adaptive Difficulty';
    let targetDifficulty = 'Medium';

    if (isAdaptive) {
      targetDifficulty = await getRecommendedDifficulty(userId, category, 'aptitude');
    } else if (['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      targetDifficulty = difficulty;
    }

    let sql = 'SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty FROM questions';
    const params = [];
    const conditions = [];

    if (category && category !== 'All' && category !== 'All Categories') {
      conditions.push('category = ?');
      params.push(category);
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
      // Shuffle & limit for fixed query
      questions = rawQuestions.sort(() => Math.random() - 0.5).slice(0, questionLimit);
    }

    return res.json({
      success: true,
      count: questions.length,
      adaptedDifficulty: targetDifficulty,
      questions
    });

  } catch (error) {
    console.error('Fetch Aptitude Questions Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve aptitude questions.' });
  }
});

/**
 * POST /api/aptitude/submit
 * Submits test answers, evaluates score against database, persists attempt, and returns results with explanations.
 */
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, difficulty, answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid answers format.' });
    }

    const questionIds = Object.keys(answers).map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (questionIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid questions submitted.' });
    }

    // Fetch complete questions from DB for verification
    const placeholders = questionIds.map(() => '?').join(',');
    const dbQuestions = await dbAsync.all(
      `SELECT * FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );

    let correctCount = 0;
    let wrongCount = 0;
    const questionResults = [];

    dbQuestions.forEach(q => {
      const userSelected = answers[q.id] || null;
      
      // Standardize comparison
      let isCorrect = false;
      if (userSelected) {
        if (userSelected.toLowerCase() === q.correct_answer.toLowerCase()) {
          isCorrect = true;
        }
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
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
        category: q.category,
        difficulty: q.difficulty
      });
    });

    const totalQuestions = dbQuestions.length;
    const score = correctCount;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100 * 10) / 10 : 0;

    const testCategory = category || 'General Aptitude';
    const testDifficulty = difficulty || 'Mixed';

    // Store attempt in SQLite
    const attemptResult = await dbAsync.run(
      `INSERT INTO aptitude_attempts (user_id, category, difficulty, score, total_questions, correct_answers, wrong_answers, percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, testCategory, testDifficulty, score, totalQuestions, correctCount, wrongCount, percentage]
    );

    // Optionally update user practice stats in student_stats
    const userStats = await dbAsync.get('SELECT * FROM student_stats WHERE user_id = ?', [userId]);
    if (userStats) {
      const newHours = Math.round((userStats.practice_hours + 0.25) * 10) / 10;
      await dbAsync.run(
        'UPDATE student_stats SET practice_hours = ?, last_practice_date = CURRENT_TIMESTAMP WHERE user_id = ?',
        [newHours, userId]
      );
    }

    // Adaptively update Unified Student Skill Profile
    updateSkillProfileFromAttempt(userId, testCategory, percentage, 'aptitude').catch(e => console.error('Skill profile sync error:', e));

    // Generate Explainable AI Feedback
    const explainableFeedback = generateAptitudeFeedback(questionResults);

    return res.json({
      success: true,
      message: 'Test evaluated and attempt saved successfully.',
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
    console.error('Aptitude Submit Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to evaluate aptitude test submission.' });
  }
});

/**
 * GET /api/aptitude/history
 * Gets user's past aptitude attempt history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const attempts = await dbAsync.all(
      'SELECT id, category, difficulty, score, total_questions, correct_answers, wrong_answers, percentage, created_at FROM aptitude_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    return res.json({
      success: true,
      attempts
    });
  } catch (error) {
    console.error('Fetch Aptitude History Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve aptitude history.' });
  }
});

module.exports = router;

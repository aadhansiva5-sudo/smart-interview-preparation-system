const express = require('express');
const { dbAsync } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getStudentSkillProfile } = require('../services/skillProfileService');
const { generatePersonalizedRecommendations } = require('../services/recommendationEngineService');
const { getKnowledgeTracingOverview } = require('../services/knowledgeTracingService');

const router = express.Router();

/**
 * GET /api/progress/summary
 * Analyzes student performance across Aptitude, Coding, Technical, AI Mock, and Resume modules.
 * Calculates readiness percentage, strong/weak areas, top recommendation, and saves to SQLite.
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    // 1. Aptitude Performance
    const aptitudeRow = await dbAsync.get(
      `SELECT AVG(percentage) as avg_score, COUNT(*) as count FROM aptitude_attempts WHERE user_id = ?`,
      [userId]
    );
    const aptitudeAttempts = aptitudeRow ? aptitudeRow.count : 0;
    const aptitudeScore = (aptitudeAttempts > 0 && aptitudeRow.avg_score !== null)
      ? Math.round(aptitudeRow.avg_score)
      : null;

    // 2. Coding Performance
    const codingRow = await dbAsync.get(
      `SELECT COUNT(*) as total_sub,
              SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted_sub,
              AVG(CASE WHEN status = 'Accepted' THEN 100 ELSE 30 END) as avg_score
       FROM coding_attempts WHERE user_id = ?`,
      [userId]
    );
    const codingSubmissions = codingRow ? codingRow.total_sub : 0;
    const codingScore = (codingSubmissions > 0 && codingRow.avg_score !== null)
      ? Math.round(codingRow.avg_score)
      : null;

    // 3. Technical Interview Performance
    const techRow = await dbAsync.get(
      `SELECT AVG(percentage) as avg_score, COUNT(*) as count FROM technical_attempts WHERE user_id = ?`,
      [userId]
    );
    const techAttempts = techRow ? techRow.count : 0;
    const techScore = (techAttempts > 0 && techRow.avg_score !== null)
      ? Math.round(techRow.avg_score)
      : null;

    // 4. AI Mock Interview Performance
    const mockRow = await dbAsync.get(
      `SELECT AVG(final_score) as avg_score, COUNT(*) as count FROM mock_interviews WHERE user_id = ?`,
      [userId]
    );
    const mockAttempts = mockRow ? mockRow.count : 0;
    const mockScore = (mockAttempts > 0 && mockRow.avg_score !== null)
      ? Math.round(mockRow.avg_score)
      : null;

    // 5. Resume Analyzer Performance
    const resumeRow = await dbAsync.get(
      `SELECT score, match_percentage FROM resume_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const resumeScore = resumeRow ? Math.round(resumeRow.score) : null;
    const resumeMatchPct = resumeRow ? Math.round(resumeRow.match_percentage) : null;

    // Build Module Map
    const modules = [
      { key: 'aptitude', name: 'Aptitude Practice', score: aptitudeScore, count: aptitudeAttempts, unit: 'attempts', targetView: 'aptitude' },
      { key: 'coding', name: 'Coding Practice', score: codingScore, count: codingSubmissions, unit: 'submissions', targetView: 'coding' },
      { key: 'technical', name: 'Technical Interview', score: techScore, count: techAttempts, unit: 'quizzes', targetView: 'technical' },
      { key: 'mock', name: 'AI Mock Interview', score: mockScore, count: mockAttempts, unit: 'sessions', targetView: 'mock' },
      { key: 'resume', name: 'Resume Analyzer', score: resumeScore, count: resumeRow ? 1 : 0, unit: 'analyses', targetView: 'resume' }
    ];

    // Calculate Overall Preparation Score
    const weights = { aptitude: 0.20, coding: 0.25, technical: 0.25, mock: 0.20, resume: 0.10 };
    let totalWeightedScore = 0;
    let totalWeightUsed = 0;
    let attemptedModulesCount = 0;

    modules.forEach(m => {
      if (m.score !== null) {
        totalWeightedScore += m.score * weights[m.key];
        totalWeightUsed += weights[m.key];
        attemptedModulesCount++;
      }
    });

    let overallScore = 0;
    if (totalWeightUsed > 0) {
      overallScore = Math.round(totalWeightedScore / totalWeightUsed);
    }

    // Determine Readiness Status
    let readinessStatus = 'Not Started';
    if (attemptedModulesCount > 0) {
      if (overallScore >= 80) readinessStatus = 'Interview Ready';
      else if (overallScore >= 60) readinessStatus = 'On Track';
      else readinessStatus = 'Needs Improvement';
    }

    // Identify Strong & Weak Areas
    const strongAreas = [];
    const weakAreas = [];

    modules.forEach(m => {
      if (m.score !== null) {
        if (m.score >= 70) {
          strongAreas.push(`${m.name} (${m.score}%)`);
        } else {
          weakAreas.push(`${m.name} (${m.score}%)`);
        }
      } else {
        weakAreas.push(`${m.name} (Not Attempted)`);
      }
    });

    // Identify Weakest Area Needing Immediate Attention
    let weakestModule = null;
    let lowestScore = 101;

    // Prioritize attempted modules with lowest scores, or unattempted modules
    const unattempted = modules.filter(m => m.score === null);
    const attempted = modules.filter(m => m.score !== null);

    if (attempted.length > 0) {
      attempted.forEach(m => {
        if (m.score < lowestScore) {
          lowestScore = m.score;
          weakestModule = m;
        }
      });
    }

    if (!weakestModule && unattempted.length > 0) {
      weakestModule = unattempted[0];
    }

    const weakestAreaName = weakestModule ? weakestModule.name : 'General Prep';

    // Generate Personalized Recommendations (with fallback to standard recommendation generator if disabled)
    let recommendations = [];
    let nextBestActivity = null;

    const personalizedData = await generatePersonalizedRecommendations(userId);
    if (personalizedData && Array.isArray(personalizedData.recommendations) && personalizedData.recommendations.length > 0) {
      recommendations = personalizedData.recommendations;
      nextBestActivity = personalizedData.nextBestActivity;
    } else {
      // Standard Fallback Recommendation Logic
      if (aptitudeScore === null || aptitudeScore < 50) {
        recommendations.push({
          id: 'rec-aptitude',
          moduleKey: 'aptitude',
          title: 'Strengthen Quantitative & Logical Aptitude',
          description: aptitudeScore === null
            ? 'You haven\'t attempted any Aptitude Quizzes yet. Take an initial diagnostic quiz.'
            : `Your average Aptitude score is ${aptitudeScore}%. Practice speed and logical reasoning problems.`,
          actionText: 'Practice Aptitude',
          targetView: 'aptitude',
          priority: 'High'
        });
      }

      if (codingScore === null || codingScore < 50) {
        recommendations.push({
          id: 'rec-coding',
          moduleKey: 'coding',
          title: 'Master Algorithm & Data Structure Problems',
          description: codingScore === null
            ? 'No coding submissions recorded. Solve beginner Array & String challenges.'
            : `Your coding accuracy is ${codingScore}%. Work on problem-solving patterns in Python or JavaScript.`,
          actionText: 'Solve Coding Problem',
          targetView: 'coding',
          priority: 'High'
        });
      }

      if (techScore === null || techScore < 50) {
        recommendations.push({
          id: 'rec-technical',
          moduleKey: 'technical',
          title: 'Revise Core Technical Fundamentals',
          description: techScore === null
            ? 'Attempt a Technical Interview Quiz to benchmark your domain knowledge.'
            : `Technical Interview score is ${techScore}%. Focus on Web Architecture, Database Indexing & REST APIs.`,
          actionText: 'Take Technical Quiz',
          targetView: 'technical',
          priority: 'Medium'
        });
      }

      if (mockScore === null || mockScore < 50) {
        recommendations.push({
          id: 'rec-mock',
          moduleKey: 'mock',
          title: 'Simulate Live AI Mock Interviews',
          description: mockScore === null
            ? 'Practice answering realistic interview questions with real-time AI scoring.'
            : `Mock Interview score is ${mockScore}%. Practice structured explanations using the STAR technique.`,
          actionText: 'Launch Mock Interview',
          targetView: 'mock',
          priority: 'High'
        });
      }

      if (resumeScore === null || resumeScore < 50) {
        recommendations.push({
          id: 'rec-resume',
          moduleKey: 'resume',
          title: 'Optimize Resume for Target Role Match',
          description: resumeScore === null
            ? 'Upload your resume (PDF/DOCX) to analyze skill coverage against target job role.'
            : `Resume score is ${resumeScore}%. Align keywords and add missing technical competencies.`,
          actionText: 'Analyze Resume',
          targetView: 'resume',
          priority: 'Medium'
        });
      }

      if (recommendations.length === 0) {
        recommendations.push({
          id: 'rec-advanced',
          moduleKey: 'mock',
          title: 'Challenge Yourself with Hard Mock Interviews',
          description: 'Great performance across all areas! Take a Hard-difficulty Technical AI Mock Interview to maintain readiness.',
          actionText: 'Start Hard Interview',
          targetView: 'mock',
          priority: 'Low'
        });
      }
    }

    if (!nextBestActivity && recommendations.length > 0) {
      const top = recommendations[0];
      nextBestActivity = {
        title: top.title,
        description: top.description,
        reason: top.reason || top.description,
        actionText: top.actionText,
        targetView: top.targetView,
        priority: top.priority,
        recommendedDifficulty: top.recommendedDifficulty || 'Medium'
      };
    }

    const topRecommendation = recommendations[0] ? recommendations[0].title : 'General Practice';

    // Save/Update Recommendation record in SQLite
    await dbAsync.run(
      `INSERT INTO progress_recommendations (user_id, overall_score, weakest_area, top_recommendation, recommendations_json, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         overall_score = excluded.overall_score,
         weakest_area = excluded.weakest_area,
         top_recommendation = excluded.top_recommendation,
         recommendations_json = excluded.recommendations_json,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, overallScore, weakestAreaName, topRecommendation, JSON.stringify(recommendations)]
    );

    // Update student_stats readiness_score
    await dbAsync.run(
      `UPDATE student_stats SET readiness_score = ? WHERE user_id = ?`,
      [overallScore, userId]
    );

    // Fetch unified skill profile
    const skillProfile = await getStudentSkillProfile(userId);

    return res.json({
      success: true,
      data: {
        overallScore,
        readinessStatus,
        weakestArea: weakestAreaName,
        topRecommendation,
        nextBestActivity,
        modules,
        strongAreas,
        weakAreas,
        recommendations,
        skillProfile
      }
    });

  } catch (error) {
    console.error('Progress Summary API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate progress summary.' });
  }
});

/**
 * GET /api/progress/skills
 * Returns student's unified skill profile matrix
 */
router.get('/skills', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const profile = await getStudentSkillProfile(userId);

    return res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Fetch Student Skill Profile Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve skill profile matrix.' });
  }
});

/**
 * GET /api/progress/knowledge-tracing
 * Returns student's BKT/ERWMA Knowledge Tracing mastery estimates, trends, and evidence breakdown
 */
router.get('/knowledge-tracing', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const overview = await getKnowledgeTracingOverview(userId);

    return res.json({
      success: true,
      ...overview
    });
  } catch (error) {
    console.error('Knowledge Tracing API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve knowledge tracing analytics.' });
  }
});

module.exports = router;

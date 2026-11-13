const { dbAsync } = require('../db');

/**
 * Feature flag checker for Knowledge Tracing
 */
function isKnowledgeTracingEnabled() {
  return process.env.ENABLE_KNOWLEDGE_TRACING !== 'false';
}

/**
 * Recency-Weighted Exponential Decay Model with Guess/Slip Corrections
 * @param {number} currentMastery - Previous estimated mastery (0 - 100)
 * @param {number} attemptScore - New observed score (0 - 100)
 * @param {number} daysElapsed - Days since last attempt
 * @param {string} sourceModule - 'aptitude' | 'technical' | 'coding' | 'mock'
 * @returns {number} New estimated mastery score (0 - 100)
 */
function calculateMasteryEstimate(currentMastery = 60, attemptScore = 70, daysElapsed = 0, sourceModule = 'general') {
  const wRecent = 0.35; // Recency weight coefficient
  const decayPerDay = 0.98; // Daily memory retention decay rate
  const decayFactor = Math.pow(decayPerDay, Math.max(0, daysElapsed));

  // Guess & Slip Adjustments
  const normScore = Math.min(1.0, Math.max(0.0, attemptScore / 100.0));
  let adjustedScore = normScore;

  if (sourceModule === 'aptitude' || sourceModule === 'technical') {
    // MCQ Guess probability P(G) = 0.25, Slip P(S) = 0.10
    const pG = 0.25;
    const pS = 0.10;
    adjustedScore = Math.max(0.0, (normScore - pG) / (1.0 - pG - pS));
  } else {
    // Practical Coding / Mock Slip P(S) = 0.05
    const pS = 0.05;
    adjustedScore = Math.min(1.0, normScore / (1.0 - pS));
  }

  const normAdjustedScore = Math.min(100.0, Math.max(0.0, adjustedScore * 100.0));
  const decayedPreviousMastery = currentMastery * decayFactor;

  const newMastery = (wRecent * normAdjustedScore) + ((1.0 - wRecent) * decayedPreviousMastery);
  return Math.min(100.0, Math.max(10.0, Math.round(newMastery * 10) / 10));
}

/**
 * Classifies skill trend direction based on mastery delta and attempt history count
 * @param {number} newMastery 
 * @param {number} previousMastery 
 * @param {number} attemptCount 
 * @returns {{trend: 'improving' | 'stable' | 'declining' | 'insufficient_history', explanation: string}}
 */
function classifyTrend(newMastery, previousMastery, attemptCount) {
  if (attemptCount < 2) {
    return {
      trend: 'insufficient_history',
      explanation: 'Insufficient assessment history (fewer than 2 assessment observations).'
    };
  }

  const delta = newMastery - previousMastery;

  if (delta >= 5.0) {
    return {
      trend: 'improving',
      explanation: `Mastery is improving (+${Math.round(delta)}% increase over recent attempts).`
    };
  } else if (delta <= -5.0) {
    return {
      trend: 'declining',
      explanation: `Mastery is declining (${Math.round(delta)}% shift due to recent errors or decay).`
    };
  } else {
    return {
      trend: 'stable',
      explanation: 'Mastery has remained stable across recent assessment attempts.'
    };
  }
}

/**
 * Updates or computes Knowledge Tracing metrics for a user's skill
 * @param {number} userId 
 * @param {string} skillName 
 * @param {string|number} categoryOrScore 
 * @param {number|string} attemptScoreOrModule 
 * @param {string} sourceModule 
 */
async function updateSkillKnowledgeTracing(userId, skillName, categoryOrScore, attemptScoreOrModule = 70, sourceModuleOrCategory = 'general') {
  if (!isKnowledgeTracingEnabled() || !userId || !skillName) return;

  let category = 'General';
  let attemptScore = 70;
  let sourceModule = 'general';

  if (typeof categoryOrScore === 'number') {
    attemptScore = categoryOrScore;
    sourceModule = attemptScoreOrModule || 'general';
    category = sourceModuleOrCategory || skillName || 'General';
  } else {
    category = categoryOrScore || 'General';
    attemptScore = typeof attemptScoreOrModule === 'number' ? attemptScoreOrModule : 70;
    sourceModule = sourceModuleOrCategory || 'general';
  }

  try {
    const existing = await dbAsync.get(
      `SELECT mastery_score, trend_direction, attempt_count, last_evaluated_at, verified_by_testing, source_modules 
       FROM student_skill_profiles WHERE user_id = ? AND skill_name = ?`,
      [userId, skillName]
    );

    let prevMastery = existing && existing.mastery_score !== null ? existing.mastery_score : 60.0;
    let prevAttempts = existing && existing.attempt_count !== null ? existing.attempt_count : 0;
    let lastDate = existing && existing.last_evaluated_at ? new Date(existing.last_evaluated_at) : new Date();

    const now = new Date();
    const daysElapsed = Math.max(0, (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    const newAttempts = prevAttempts + 1;
    const newMastery = calculateMasteryEstimate(prevMastery, attemptScore, daysElapsed, sourceModule);
    const { trend } = classifyTrend(newMastery, prevMastery, newAttempts);

    let sourceList = [sourceModule];
    if (existing && existing.source_modules) {
      try {
        const parsed = JSON.parse(existing.source_modules);
        if (Array.isArray(parsed)) sourceList = Array.from(new Set([...parsed, sourceModule]));
      } catch (e) { }
    }

    const isVerified = attemptScore >= 80 || (existing && existing.verified_by_testing === 1) ? 1 : 0;

    await dbAsync.run(
      `INSERT INTO student_skill_profiles 
         (user_id, skill_name, category, proficiency_score, confidence_level, verified_by_testing, source_modules, last_evaluated_at, mastery_score, trend_direction, attempt_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
       ON CONFLICT(user_id, skill_name) DO UPDATE SET
         category = excluded.category,
         proficiency_score = excluded.proficiency_score,
         mastery_score = excluded.mastery_score,
         trend_direction = excluded.trend_direction,
         attempt_count = excluded.attempt_count,
         verified_by_testing = excluded.verified_by_testing,
         source_modules = excluded.source_modules,
         last_evaluated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        skillName,
        category,
        newMastery,
        Math.min(1.0, 0.5 + (newAttempts * 0.1)),
        isVerified,
        JSON.stringify(sourceList),
        newMastery,
        trend,
        newAttempts
      ]
    );
  } catch (err) {
    console.error('Error updating Knowledge Tracing metrics:', err);
  }
}

/**
 * Returns Knowledge Tracing Overview & Skill Mastery Matrix for a candidate
 * @param {number} userId 
 */
async function getKnowledgeTracingOverview(userId) {
  if (!isKnowledgeTracingEnabled() || !userId) {
    return {
      enabled: isKnowledgeTracingEnabled(),
      data: { masteryMatrix: [], trendSummary: { improving: 0, stable: 0, declining: 0, insufficient: 0 }, overallMastery: 0 }
    };
  }


  try {
    const rows = await dbAsync.all(
      `SELECT skill_name, category, proficiency_score, mastery_score, trend_direction, attempt_count, verified_by_testing, source_modules, last_evaluated_at
       FROM student_skill_profiles WHERE user_id = ? ORDER BY category ASC, mastery_score DESC`,
      [userId]
    );

    let totalMastery = 0;
    const trendSummary = { improving: 0, stable: 0, declining: 0, insufficient: 0 };

    const masteryMatrix = rows.map(r => {
      const attempts = r.attempt_count || 0;
      const mastery = r.mastery_score !== null ? Math.round(r.mastery_score) : Math.round(r.proficiency_score || 60);
      const prevMastery = Math.max(10, mastery - (r.trend_direction === 'improving' ? 8 : (r.trend_direction === 'declining' ? -8 : 0)));

      const { trend, explanation } = classifyTrend(mastery, prevMastery, attempts);

      if (trend === 'improving') trendSummary.improving++;
      else if (trend === 'declining') trendSummary.declining++;
      else if (trend === 'insufficient_history') trendSummary.insufficient++;
      else trendSummary.stable++;

      totalMastery += mastery;

      let sources = [];
      try { sources = JSON.parse(r.source_modules || '[]'); } catch (e) { sources = []; }

      return {
        skillName: r.skill_name,
        category: r.category,
        proficiencyScore: Math.round(r.proficiency_score || 60),
        estimatedMastery: mastery,
        trendDirection: trend,
        attemptCount: attempts,
        isVerified: r.verified_by_testing === 1,
        sourceModules: sources,
        lastEvaluated: r.last_evaluated_at,
        explanation
      };
    });

    const overallMastery = rows.length > 0 ? Math.round(totalMastery / rows.length) : 0;

    return {
      enabled: isKnowledgeTracingEnabled(),
      data: {
        overallMastery,
        trendSummary,
        masteryMatrix
      }
    };
  } catch (err) {
    console.error('Error fetching Knowledge Tracing Overview:', err);
    return {
      enabled: isKnowledgeTracingEnabled(),
      data: { masteryMatrix: [], trendSummary: { improving: 0, stable: 0, declining: 0, insufficient: 0 }, overallMastery: 0 }
    };
  }
}

async function getSkillMasteryProfile(userId, skillName) {
  if (!userId || !skillName) return null;
  try {
    const row = await dbAsync.get(
      `SELECT skill_name, category, mastery_score, trend_direction, attempt_count, verified_by_testing, last_evaluated_at
       FROM student_skill_profiles WHERE user_id = ? AND skill_name = ?`,
      [userId, skillName]
    );

    if (!row) {
      return {
        skillName,
        category: 'General',
        masteryScore: 60,
        trendDirection: 'insufficient_history',
        observationCount: 0,
        isVerified: false,
        explanation: 'No assessment observations recorded for this skill.'
      };
    }

    const attempts = row.attempt_count || 0;
    const mastery = row.mastery_score !== null ? Math.round(row.mastery_score) : 60;
    const trend = attempts < 2 ? 'insufficient_history' : (row.trend_direction || 'stable');

    return {
      skillName: row.skill_name,
      category: row.category,
      masteryScore: mastery,
      trendDirection: trend,
      observationCount: attempts,
      isVerified: row.verified_by_testing === 1,
      explanation: `Estimated mastery score is ${mastery}% based on ${attempts} assessment observations (${trend.toUpperCase()}).`
    };
  } catch (err) {
    console.error('Error fetching single skill mastery profile:', err);
    return null;
  }
}

module.exports = {
  isKnowledgeTracingEnabled,
  calculateMasteryEstimate,
  classifyTrend,
  updateSkillKnowledgeTracing,
  updateSkillMasteryFromAssessment: updateSkillKnowledgeTracing,
  getSkillMasteryProfile,
  getKnowledgeTracingOverview
};


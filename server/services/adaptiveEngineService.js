const { dbAsync } = require('../db');
const { upsertStudentSkills } = require('./skillProfileService');
const { updateSkillKnowledgeTracing } = require('./knowledgeTracingService');

/**
 * Maps a numeric proficiency score (0-100) to a difficulty string
 * @param {number} score 
 * @returns {'Easy' | 'Medium' | 'Hard'}
 */
function scoreToDifficulty(score) {
  if (score < 50) return 'Easy';
  if (score < 78) return 'Medium';
  return 'Hard';
}

/**
 * Fetch recommended difficulty for a user in a specific category or module
 * @param {number} userId 
 * @param {string} category 
 * @param {string} moduleName - 'aptitude' | 'technical' | 'coding' | 'mock'
 * @returns {Promise<'Easy' | 'Medium' | 'Hard'>}
 */
async function getRecommendedDifficulty(userId, category = null, moduleName = 'general') {
  if (!userId) return 'Medium';

  try {
    let skillRow = null;

    // 1. Check exact skill match if category provided
    if (category && category !== 'All' && category !== 'All Categories' && category !== 'All Technologies') {
      skillRow = await dbAsync.get(
        `SELECT proficiency_score, confidence_level, mastery_score, trend_direction FROM student_skill_profiles 
         WHERE user_id = ? AND (LOWER(skill_name) = LOWER(?) OR LOWER(category) = LOWER(?)) 
         ORDER BY proficiency_score DESC LIMIT 1`,
        [userId, category, category]
      );
    }

    // 2. Knowledge Tracing Trend-Aware Adjustment
    if (skillRow) {
      const baseScore = skillRow.mastery_score !== undefined && skillRow.mastery_score !== null
        ? skillRow.mastery_score
        : skillRow.proficiency_score;

      let calcDiff = scoreToDifficulty(baseScore);

      // Guardrail: If skill trend is declining, prevent escalating to Hard prematurely
      if (skillRow.trend_direction === 'declining' && calcDiff === 'Hard') {
        calcDiff = 'Medium';
      }

      return calcDiff;
    }

    // 3. Check average proficiency across category or module
    const avgRow = await dbAsync.get(
      `SELECT AVG(proficiency_score) as avg_score, COUNT(*) as total FROM student_skill_profiles WHERE user_id = ?`,
      [userId]
    );

    if (avgRow && avgRow.total > 0 && avgRow.avg_score !== null) {
      return scoreToDifficulty(avgRow.avg_score);
    }

    // 4. Fallback to user experience level if profile is completely empty
    const user = await dbAsync.get(`SELECT experience_level FROM users WHERE id = ?`, [userId]);
    if (user && user.experience_level) {
      const exp = user.experience_level.toLowerCase();
      if (exp.includes('senior') || exp.includes('lead')) return 'Hard';
      if (exp.includes('mid') || exp.includes('intermediate')) return 'Medium';
      if (exp.includes('entry') || exp.includes('junior') || exp.includes('fresh')) return 'Easy';
    }

    return 'Medium';
  } catch (error) {
    console.error('Error calculating recommended difficulty:', error);
    return 'Medium';
  }
}

/**
 * Adaptively filters and orders questions matching target difficulty with fallback
 * @param {Array<Object>} questions 
 * @param {string} targetDifficulty - 'Easy' | 'Medium' | 'Hard'
 * @param {number} limit 
 * @returns {Array<Object>}
 */
function pickAdaptiveQuestions(questions, targetDifficulty = 'Medium', limit = 10) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const normTarget = targetDifficulty.toLowerCase();

  // Group by difficulty
  const targetGroup = [];
  const adjacentGroup = [];
  const otherGroup = [];

  questions.forEach(q => {
    const diff = (q.difficulty || 'Medium').toLowerCase();
    if (diff === normTarget) {
      targetGroup.push(q);
    } else if (
      (normTarget === 'medium' && (diff === 'easy' || diff === 'hard')) ||
      (normTarget === 'easy' && diff === 'medium') ||
      (normTarget === 'hard' && diff === 'medium')
    ) {
      adjacentGroup.push(q);
    } else {
      otherGroup.push(q);
    }
  });

  // Shuffle array helper
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  // Combine with priority: Target difficulty > Adjacent difficulty > Remaining
  const pool = [...shuffle(targetGroup), ...shuffle(adjacentGroup), ...shuffle(otherGroup)];
  return pool.slice(0, limit);
}

/**
 * Updates user's skill profile based on attempt submission performance
 * @param {number} userId 
 * @param {string} category 
 * @param {number} percentage 
 * @param {string} sourceModule - 'aptitude' | 'technical' | 'coding' | 'mock'
 */
async function updateSkillProfileFromAttempt(userId, category, percentage, sourceModule) {
  if (!userId || !category) return;

  try {
    const existing = await dbAsync.get(
      `SELECT proficiency_score, confidence_level FROM student_skill_profiles WHERE user_id = ? AND skill_name = ?`,
      [userId, category]
    );

    let currentProf = existing ? existing.proficiency_score : 60;
    // Exponential moving average for smooth adaptive skill adjustment
    let newProf = Math.round(currentProf * 0.65 + percentage * 0.35);
    newProf = Math.min(100, Math.max(10, newProf));

    const isVerified = percentage >= 80 ? 1 : (existing && existing.verified_by_testing ? 1 : 0);
    const confidence = Math.min(1.0, Math.max(0.5, (existing ? existing.confidence_level : 0.6) + 0.05));

    await upsertStudentSkills(userId, [{
      name: category,
      category: category.includes('Aptitude') || category.includes('Reasoning') || category.includes('Verbal') ? 'Aptitude' : 'Technical',
      proficiency: newProf,
      confidence,
      verified: isVerified
    }], sourceModule);

    // Sync Knowledge Tracing BKT/ERWMA Metrics
    updateSkillKnowledgeTracing(userId, category, category, percentage, sourceModule).catch(e => console.error('KT sync error:', e));

  } catch (error) {
    console.error('Error updating skill profile from attempt:', error);
  }
}

module.exports = {
  getRecommendedDifficulty,
  pickAdaptiveQuestions,
  updateSkillProfileFromAttempt,
  scoreToDifficulty
};

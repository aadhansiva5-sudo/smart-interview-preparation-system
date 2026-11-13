const { dbAsync } = require('../db');

/**
 * Atomic Upsert for Student Skills into SQLite student_skill_profiles
 * @param {number} userId 
 * @param {Array<{name: string, category: string, proficiency: number, confidence: number, verified: number}>} skills 
 * @param {string} sourceModule - 'resume' | 'coding' | 'technical' | 'mock'
 */
async function upsertStudentSkills(userId, skills, sourceModule = 'resume') {
  if (!userId || !Array.isArray(skills) || skills.length === 0) return;

  for (const s of skills) {
    const skillName = s.name;
    const category = s.category || 'General';
    const proficiency = Math.min(100, Math.max(0, s.proficiency || 70));
    const confidence = Math.min(1.0, Math.max(0.0, s.confidence || 0.60));
    const verified = s.verified || (sourceModule === 'coding' || sourceModule === 'technical' ? 1 : 0);

    // Fetch existing skill row if present
    const existing = await dbAsync.get(
      `SELECT source_modules, confidence_level, verified_by_testing FROM student_skill_profiles WHERE user_id = ? AND skill_name = ?`,
      [userId, skillName]
    );

    let sourceList = [sourceModule];
    let newConfidence = confidence;
    let newVerified = verified;

    if (existing) {
      try {
        const parsed = JSON.parse(existing.source_modules || '[]');
        if (Array.isArray(parsed)) {
          sourceList = Array.from(new Set([...parsed, sourceModule]));
        }
      } catch (e) {
        sourceList = [sourceModule];
      }
      newConfidence = Math.max(existing.confidence_level || 0, confidence);
      newVerified = existing.verified_by_testing === 1 ? 1 : verified;
    }

    await dbAsync.run(
      `INSERT INTO student_skill_profiles 
         (user_id, skill_name, category, proficiency_score, confidence_level, verified_by_testing, source_modules, last_evaluated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, skill_name) DO UPDATE SET
         category = excluded.category,
         proficiency_score = excluded.proficiency_score,
         confidence_level = ?,
         verified_by_testing = ?,
         source_modules = ?,
         last_evaluated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        skillName,
        category,
        proficiency,
        confidence,
        verified,
        JSON.stringify(sourceList),
        newConfidence,
        newVerified,
        JSON.stringify(sourceList)
      ]
    );
  }
}

/**
 * Fetch Student's Consolidated Skill Profile
 * @param {number} userId 
 */
async function getStudentSkillProfile(userId) {
  const rows = await dbAsync.all(
    `SELECT id, skill_name, category, proficiency_score, mastery_score, trend_direction, attempt_count, confidence_level, verified_by_testing, source_modules, last_evaluated_at
     FROM student_skill_profiles
     WHERE user_id = ?
     ORDER BY category ASC, proficiency_score DESC`,
    [userId]
  );

  const categories = {};
  let totalProficiency = 0;
  let verifiedCount = 0;

  const skillsList = rows.map(r => {
    let sources = [];
    try { sources = JSON.parse(r.source_modules); } catch (e) { sources = []; }

    const item = {
      id: r.id,
      name: r.skill_name,
      skill_name: r.skill_name,
      category: r.category,
      proficiency: Math.round(r.proficiency_score),
      mastery_score: r.mastery_score !== null ? r.mastery_score : r.proficiency_score,
      trend_direction: r.trend_direction || 'stable',
      attempt_count: r.attempt_count || 0,
      confidence: Math.round(r.confidence_level * 100) / 100,
      verified: r.verified_by_testing === 1,
      verified_by_testing: r.verified_by_testing,
      sources,
      source_modules: sources,
      lastEvaluated: r.last_evaluated_at
    };

    if (!categories[r.category]) {
      categories[r.category] = [];
    }
    categories[r.category].push(item);

    totalProficiency += r.proficiency_score;
    if (r.verified_by_testing === 1) verifiedCount++;

    return item;
  });

  const totalSkills = rows.length;
  const avgProficiency = totalSkills > 0 ? Math.round(totalProficiency / totalSkills) : 0;

  return {
    totalSkills,
    verifiedCount,
    avgProficiency,
    skills: skillsList,
    categories
  };
}


module.exports = {
  upsertStudentSkills,
  getStudentSkillProfile
};

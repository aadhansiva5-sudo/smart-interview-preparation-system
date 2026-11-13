const { dbAsync } = require('../db');
const { getStudentSkillProfile } = require('./skillProfileService');
const { getRecommendedDifficulty } = require('./adaptiveEngineService');

/**
 * Feature flag checker
 */
function isPersonalizedRecommendationsEnabled() {
  return process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS !== 'false';
}

/**
 * Generate Personalized Preparation Recommendations for a logged-in student
 * @param {number} userId 
 * @returns {Promise<{recommendations: Array<Object>, nextBestActivity: Object} | null>}
 */
async function generatePersonalizedRecommendations(userId) {
  if (!isPersonalizedRecommendationsEnabled()) {
    return null; // Return null to trigger graceful fallback when disabled
  }

  try {
    // 1. Fetch User Profile
    const user = await dbAsync.get(
      `SELECT name, target_role, experience_level FROM users WHERE id = ?`,
      [userId]
    );
    const targetRole = user?.target_role || 'Full Stack Developer';

    // 2. Fetch Skill Profile Matrix
    const skillProfile = await getStudentSkillProfile(userId);
    const skills = skillProfile.skills || [];

    // 3. Fetch Attempt Histories Across All Modules
    const aptitudeRow = await dbAsync.get(
      `SELECT AVG(percentage) as avg_score, COUNT(*) as count FROM aptitude_attempts WHERE user_id = ?`,
      [userId]
    );
    const aptitudeScore = (aptitudeRow && aptitudeRow.count > 0 && aptitudeRow.avg_score !== null)
      ? Math.round(aptitudeRow.avg_score) : null;

    const codingRow = await dbAsync.get(
      `SELECT COUNT(*) as total_sub,
              SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted_sub,
              AVG(CASE WHEN status = 'Accepted' THEN 100 ELSE 30 END) as avg_score
       FROM coding_attempts WHERE user_id = ?`,
      [userId]
    );
    const codingScore = (codingRow && codingRow.total_sub > 0 && codingRow.avg_score !== null)
      ? Math.round(codingRow.avg_score) : null;

    const techRow = await dbAsync.get(
      `SELECT AVG(percentage) as avg_score, COUNT(*) as count FROM technical_attempts WHERE user_id = ?`,
      [userId]
    );
    const techScore = (techRow && techRow.count > 0 && techRow.avg_score !== null)
      ? Math.round(techRow.avg_score) : null;

    const mockRow = await dbAsync.get(
      `SELECT AVG(final_score) as avg_score, COUNT(*) as count FROM mock_interviews WHERE user_id = ?`,
      [userId]
    );
    const mockScore = (mockRow && mockRow.count > 0 && mockRow.avg_score !== null)
      ? Math.round(mockRow.avg_score) : null;

    const resumeRow = await dbAsync.get(
      `SELECT score, match_percentage FROM resume_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const resumeScore = resumeRow ? Math.round(resumeRow.score) : null;

    // 4. Build Candidate Recommendation Items
    const candidateRecs = [];

    // (A) Aptitude Module Recommendation
    const aptDiff = await getRecommendedDifficulty(userId, 'Aptitude', 'aptitude');
    const aptSkill = skills.find(s => s.skill_name === 'Quantitative Aptitude' || s.category === 'Aptitude');
    let aptScoreVal = aptitudeScore !== null ? aptitudeScore : 0;
    let aptPriorityScore = (100 - aptScoreVal) * 1.0;
    if (aptitudeScore === null) aptPriorityScore += 10; // Bonus for unattempted

    let aptReason = aptitudeScore === null
      ? 'No aptitude attempts recorded yet. Aptitude is a mandatory filter in initial placement rounds.'
      : `Recent average score (${aptitudeScore}%) is below the target 65% threshold for placement eligibility.`;

    if (aptSkill && aptSkill.trend_direction === 'declining') {
      aptPriorityScore += 25;
      aptReason = `Knowledge Tracing detected a declining learning trend in 'Quantitative Aptitude'. Focused practice is recommended.`;
    }

    candidateRecs.push({
      id: 'rec-aptitude',
      moduleKey: 'aptitude',
      title: 'Practice Quantitative & Logical Aptitude',
      description: aptitudeScore === null
        ? 'Take an initial Aptitude quiz to establish your quantitative and logical reasoning baseline.'
        : `Your average Aptitude score is ${aptitudeScore}% (target threshold: 65%). Work on speed and problem-solving.`,
      reason: aptReason,
      actionText: `Practice Aptitude [${aptDiff}]`,
      targetView: 'aptitude',
      recommendedDifficulty: aptDiff,
      priorityScore: aptPriorityScore,
      category: 'Quantitative Aptitude'
    });

    // (B) Coding Practice Module Recommendation
    const codingDiff = await getRecommendedDifficulty(userId, 'Algorithms', 'coding');
    const codingSkill = skills.find(s => s.category === 'Coding' || s.category === 'Algorithms');
    let codingScoreVal = codingScore !== null ? codingScore : 0;
    let codingPriorityScore = (100 - codingScoreVal) * 1.2;
    if (codingScore === null) codingPriorityScore += 15;

    let codingReason = codingScore === null
      ? 'No coding submissions found. Practical coding execution is crucial for technical screening.'
      : `Your current coding accuracy (${codingScore}%) indicates room for algorithmic optimization.`;

    if (codingSkill && codingSkill.trend_direction === 'declining') {
      codingPriorityScore += 25;
      codingReason = `Knowledge Tracing detected a declining learning trend in coding skills. Focused practice is recommended.`;
    }

    candidateRecs.push({
      id: 'rec-coding',
      moduleKey: 'coding',
      title: 'Master Data Structure & Algorithmic Problems',
      description: codingScore === null
        ? 'Solve beginner Array & String challenges to build your programming problem-solving foundation.'
        : `Your coding submission accuracy is ${codingScore}%. Solve targeted algorithmic challenges.`,
      reason: codingReason,
      actionText: `Solve Coding Problem [${codingDiff}]`,
      targetView: 'coding',
      recommendedDifficulty: codingDiff,
      priorityScore: codingPriorityScore,
      category: 'Algorithms'
    });

    // (C) Technical Interview Module Recommendation
    const techDiff = await getRecommendedDifficulty(userId, 'General Technical', 'technical');
    let techScoreVal = techScore !== null ? techScore : 0;
    let techPriorityScore = (100 - techScoreVal) * 1.1;
    if (techScore === null) techPriorityScore += 12;

    candidateRecs.push({
      id: 'rec-technical',
      moduleKey: 'technical',
      title: 'Revise Core Technical Fundamentals',
      description: techScore === null
        ? 'Attempt a Technical Interview Quiz to benchmark your domain knowledge.'
        : `Your technical quiz score is ${techScore}%. Focus on Web Architecture, Databases, and Language Mechanisms.`,
      reason: techScore === null
        ? 'No technical quiz attempts recorded. Technical knowledge benchmarks your core CS understanding.'
        : `Technical practice accuracy (${techScore}%) is below target threshold for '${targetRole}' interviews.`,
      actionText: `Take Technical Quiz [${techDiff}]`,
      targetView: 'technical',
      recommendedDifficulty: techDiff,
      priorityScore: techPriorityScore,
      category: 'Technical Fundamentals'
    });

    // (D) AI Mock Interview Recommendation
    const mockDiff = await getRecommendedDifficulty(userId, targetRole, 'mock');
    let mockScoreVal = mockScore !== null ? mockScore : 0;
    let mockPriorityScore = (100 - mockScoreVal) * 1.0;
    if (mockScore === null) mockPriorityScore += 10;

    candidateRecs.push({
      id: 'rec-mock',
      moduleKey: 'mock',
      title: `Simulate AI Mock Interview for ${targetRole}`,
      description: mockScore === null
        ? `Practice answering realistic technical interview questions tailored for a '${targetRole}'.`
        : `Your average AI Mock Interview score is ${mockScore}%. Practice structured explanations using STAR method.`,
      reason: mockScore === null
        ? `No mock interviews completed for '${targetRole}'. Mock interviews build verbal articulation confidence.`
        : `Average mock interview score (${mockScore}%) can be improved with structured technical answers.`,
      actionText: `Launch AI Mock Interview [${mockDiff}]`,
      targetView: 'mock',
      recommendedDifficulty: mockDiff,
      priorityScore: mockPriorityScore,
      category: targetRole
    });

    // (E) Knowledge Tracing Declining Skill Recommendations
    const decliningSkills = skills.filter(s => s.trend_direction === 'declining');
    if (decliningSkills.length > 0) {
      const topDeclining = decliningSkills[0];
      const targetModule = topDeclining.category === 'Aptitude' ? 'aptitude' : 'coding';
      candidateRecs.push({
        id: `rec-declining-${topDeclining.id || 'skill'}`,
        moduleKey: targetModule,
        title: `Reverse Declining Trend in ${topDeclining.skill_name}`,
        description: `Your Knowledge Tracing trend for ${topDeclining.skill_name} is currently declining due to recent attempt errors or time decay.`,
        reason: `Knowledge Tracing detected a declining trend in '${topDeclining.skill_name}'. Focused practice will restore mastery.`,
        actionText: `Practice ${topDeclining.skill_name}`,
        targetView: targetModule,
        recommendedDifficulty: 'Medium',
        priorityScore: 115, // High priority bonus ensuring top rank for declining trends
        category: topDeclining.category || 'Technical'
      });
    }


    // (F) Resume Skill Verification Recommendations
    const unverifiedResumeSkills = skills.filter(s => !s.verified_by_testing && s.source_modules?.includes('resume'));
    if (unverifiedResumeSkills.length > 0) {
      const topUnverified = unverifiedResumeSkills[0];
      candidateRecs.push({
        id: `rec-unverified-${topUnverified.id || 'skill'}`,
        moduleKey: 'coding',
        title: `Verify Claimed Resume Skill: ${topUnverified.skill_name}`,
        description: `'${topUnverified.skill_name}' was extracted from your resume, but is not yet verified through practical testing.`,
        reason: `Skill '${topUnverified.skill_name}' is listed on your resume but unverified. Verifying it will boost your readiness score.`,
        actionText: `Verify ${topUnverified.skill_name}`,
        targetView: 'coding',
        recommendedDifficulty: 'Medium',
        priorityScore: 75,
        category: topUnverified.category || 'Languages'
      });
    }

    // (F) Resume Optimization Recommendation
    if (resumeScore === null || resumeScore < 65) {
      let resPriorityScore = (100 - (resumeScore || 0)) * 0.9;
      if (resumeScore === null) resPriorityScore += 10;

      candidateRecs.push({
        id: 'rec-resume',
        moduleKey: 'resume',
        title: 'Optimize Resume for Target Role Match',
        description: resumeScore === null
          ? 'Upload your resume (PDF/DOCX) to analyze skill coverage against your target role.'
          : `Your resume match score is ${resumeScore}%. Align keywords and add missing technical competencies.`,
        reason: resumeScore === null
          ? 'No resume uploaded. Resume analysis identifies critical missing skills for your target role.'
          : `Resume match score (${resumeScore}%) indicates missing key skills expected for '${targetRole}'.`,
        actionText: 'Analyze Resume',
        targetView: 'resume',
        recommendedDifficulty: 'Easy',
        priorityScore: resPriorityScore,
        category: 'Resume Match'
      });
    }

    // 5. Rank and Assign Priority Tiers (High, Medium, Low)
    candidateRecs.sort((a, b) => b.priorityScore - a.priorityScore);

    const enrichedRecommendations = candidateRecs.slice(0, 5).map(rec => {
      let priorityTier = 'Medium';
      if (rec.priorityScore >= 65) priorityTier = 'High';
      else if (rec.priorityScore < 40) priorityTier = 'Low';

      return {
        id: rec.id,
        moduleKey: rec.moduleKey,
        title: rec.title,
        description: rec.description,
        reason: rec.reason,
        actionText: rec.actionText,
        targetView: rec.targetView,
        priority: priorityTier,
        recommendedDifficulty: rec.recommendedDifficulty,
        category: rec.category
      };
    });

    // 6. Compute Next Best Activity
    const topRec = enrichedRecommendations[0];
    const nextBestActivity = {
      title: topRec.title,
      description: topRec.description,
      reason: topRec.reason,
      actionText: topRec.actionText,
      targetView: topRec.targetView,
      priority: topRec.priority,
      recommendedDifficulty: topRec.recommendedDifficulty
    };

    return {
      recommendations: enrichedRecommendations,
      nextBestActivity
    };

  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    return null;
  }
}

module.exports = {
  isPersonalizedRecommendationsEnabled,
  generatePersonalizedRecommendations
};

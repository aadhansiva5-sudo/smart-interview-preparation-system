const https = require('https');
const { dbAsync } = require('../db');
const { getRecommendedDifficulty } = require('./adaptiveEngineService');

/**
 * Generate 5 dynamic, personalized interview questions tailored to student's resume skills, target role, and skill profile
 * @param {number} userId 
 * @param {string} targetRole 
 * @param {string} interviewType 
 * @param {string} difficultyInput 
 * @param {Object} QUESTION_BANK 
 * @returns {Promise<{questions: Array<string>, effectiveDifficulty: string}>}
 */
async function generateResumeAwareQuestions(userId, targetRole = 'Full Stack Developer', interviewType = 'Technical', difficultyInput = 'Adaptive', QUESTION_BANK = {}) {
  // 1. Resolve Effective Difficulty using Adaptive Engine
  let effectiveDifficulty = difficultyInput;
  if (!difficultyInput || difficultyInput.toLowerCase() === 'adaptive' || difficultyInput === 'Adaptive Difficulty') {
    effectiveDifficulty = await getRecommendedDifficulty(userId, targetRole, 'mock');
  }

  // 2. Fetch Student's Skill Profile from SQLite
  let verifiedSkills = [];
  let unverifiedSkills = [];
  let allSkillNames = [];

  try {
    const profileRows = await dbAsync.all(
      `SELECT skill_name, category, proficiency_score, verified_by_testing, source_modules 
       FROM student_skill_profiles 
       WHERE user_id = ?`,
      [userId]
    );

    profileRows.forEach(row => {
      allSkillNames.push(row.skill_name);
      if (row.verified_by_testing === 1) {
        verifiedSkills.push(row.skill_name);
      } else {
        unverifiedSkills.push(row.skill_name);
      }
    });
  } catch (err) {
    console.error('Error fetching skill profile for resume-aware interview:', err);
  }

  // 3. Fetch Previously Asked Questions to Prevent Repetition
  let previousQuestions = [];
  try {
    const pastSessions = await dbAsync.all(
      `SELECT questions FROM mock_interviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    pastSessions.forEach(session => {
      try {
        const qArr = JSON.parse(session.questions);
        if (Array.isArray(qArr)) {
          previousQuestions.push(...qArr);
        }
      } catch (e) { }
    });
  } catch (err) {
    console.error('Error fetching interview history for deduplication:', err);
  }

  // 4. Handle HR Interview Type
  if (interviewType === 'HR') {
    const defaultHr = QUESTION_BANK?.HR?.General || [
      "Tell me about yourself, your background, and why you are interested in this target role.",
      "Describe a challenging technical project or conflict you faced in a team. How did you handle it?",
      "What is your greatest professional strength and one area you actively work to improve?",
      "Where do you see your career path evolving over the next 3 to 5 years?",
      "Why do you want to join our organization, and what unique value do you bring?"
    ];
    return {
      questions: deduplicateQuestions(defaultHr, previousQuestions),
      effectiveDifficulty
    };
  }

  // 5. Try Gemini AI Generation if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key_here' && !apiKey.startsWith('AIzaSy_demo')) {
    try {
      const aiQuestions = await callGeminiQuestionGenerator(
        apiKey,
        targetRole,
        interviewType,
        effectiveDifficulty,
        verifiedSkills,
        unverifiedSkills,
        previousQuestions
      );

      if (aiQuestions && Array.isArray(aiQuestions) && aiQuestions.length === 5) {
        return {
          questions: aiQuestions,
          effectiveDifficulty
        };
      }
    } catch (err) {
      console.log('Gemini Question Generation note (using fallback resume-aware generator):', err.message);
    }
  }

  // 6. Intelligent Fallback Resume-Aware Question Generator
  const fallbackQuestions = generateFallbackResumeAwareQuestions(
    targetRole,
    effectiveDifficulty,
    verifiedSkills,
    unverifiedSkills,
    previousQuestions,
    QUESTION_BANK
  );

  return {
    questions: fallbackQuestions,
    effectiveDifficulty
  };
}

/**
 * Calls Gemini AI API to generate 5 tailored, non-repetitive interview questions
 */
function callGeminiQuestionGenerator(apiKey, role, type, difficulty, verified, unverified, history) {
  return new Promise((resolve) => {
    const promptText = `
You are an expert lead technical interviewer conducting a ${difficulty} level ${type} interview for a candidate targeting the position of '${role}'.

Candidate Resume & Skill Profile Context:
- Verified Demonstrated Skills: ${verified.length > 0 ? verified.join(', ') : 'None verified yet'}
- Resume Extracted Skills (Unverified): ${unverified.length > 0 ? unverified.join(', ') : 'General software engineering skills'}
- Previously Asked Questions (DO NOT REPEAT ANY OF THESE): ${history.slice(0, 15).join(' | ')}

Generate EXACTLY 5 distinct, high-quality interview questions tailored specifically for this candidate:
1. Question 1 (Verified Skill Deep-Dive): Deep architectural/technical question testing verified skills.
2. Question 2 (Resume Skill Validation): Practical scenario validating claimed resume skills.
3. Question 3 (Role Requirement & Core CS): System design or core language mechanism question for '${role}'.
4. Question 4 (Problem Solving & Edge Cases): Harder scenario/debugging question aligned with ${difficulty} difficulty.
5. Question 5 (Role Skill Gap / Emerging Tech): Question addressing a key technology expected for '${role}'.

Return ONLY a valid JSON array of 5 plain text question strings:
[
  "Question 1 text...",
  "Question 2 text...",
  "Question 3 text...",
  "Question 4 text...",
  "Question 5 text..."
]
`;

    const postData = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 4500
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const rawText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const arr = JSON.parse(cleanJsonStr);
            if (Array.isArray(arr) && arr.length >= 5) {
              return resolve(arr.slice(0, 5));
            }
          }
        } catch (e) {
          return resolve(null);
        }
        resolve(null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

/**
 * Intelligent Fallback Resume-Aware Question Selector & Personalizer
 */
function generateFallbackResumeAwareQuestions(role, difficulty, verified, unverified, history, QUESTION_BANK) {
  const defaultBank = [
    "Can you explain the difference between client-side rendering (CSR) and server-side rendering (SSR), and when would you choose one over the other?",
    "How do you design a secure RESTful API authentication system using JSON Web Tokens (JWT) or session cookies?",
    "Explain the event loop in Node.js and how non-blocking asynchronous I/O operates under the hood.",
    "How do database indexes improve query execution speed, and what are the trade-offs of over-indexing a database?",
    "Describe how you handle state management and data caching in a modern web application."
  ];

  const roleBank = QUESTION_BANK?.Technical?.[role] || QUESTION_BANK?.Technical?.['Full Stack Developer'] || defaultBank;
  const candidateSkills = [...verified, ...unverified];

  const pool = [...roleBank];

  // Personalize questions using candidate's resume skills if available
  if (candidateSkills.length > 0) {
    const primarySkill = candidateSkills[0];
    const secondarySkill = candidateSkills[1] || 'REST APIs';

    pool.push(`In your work with ${primarySkill}, how do you structure your code and manage application state to ensure high performance and scalability?`);
    pool.push(`Can you explain a complex bug or performance bottleneck you encountered while using ${secondarySkill}, and how you debugged and resolved it?`);
    pool.push(`What best practices do you follow when integrating ${primarySkill} with backend microservices or relational databases?`);
  } else {
    pool.push("Describe a challenging technical architectural decision you made in a recent software project and the lessons learned.");
    pool.push("How do you approach debugging complex memory leaks or asynchronous performance issues in production?");
  }

  // Deduplicate against past interview history
  const uniquePool = pool.filter(q => !history.some(prev => prev.toLowerCase().includes(q.toLowerCase().slice(0, 20))));

  // Shuffle and select 5
  const shuffled = uniquePool.sort(() => Math.random() - 0.5);
  if (shuffled.length >= 5) {
    return shuffled.slice(0, 5);
  }

  // If pool has fewer than 5 unique, pad from original role bank & default bank
  const combined = Array.from(new Set([...shuffled, ...roleBank, ...defaultBank]));
  return combined.slice(0, 5);
}

/**
 * Deduplicate question array against past question history
 */
function deduplicateQuestions(candidates, history) {
  if (!Array.isArray(history) || history.length === 0) return candidates.slice(0, 5);
  const filtered = candidates.filter(c => !history.includes(c));
  return (filtered.length >= 5 ? filtered : candidates).slice(0, 5);
}

module.exports = {
  generateResumeAwareQuestions
};

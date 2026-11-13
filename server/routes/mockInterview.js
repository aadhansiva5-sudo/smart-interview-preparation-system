const express = require('express');
const https = require('https');
const { dbAsync } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateResumeAwareQuestions } = require('../services/resumeAwareInterviewService');
const { enrichMockAnswerEvaluation } = require('../services/explainableFeedbackService');

const router = express.Router();

// Question Bank Repository per Target Role & Interview Type
const QUESTION_BANK = {
  Technical: {
    'Full Stack Developer': [
      "Can you explain the difference between client-side rendering (CSR) and server-side rendering (SSR), and when would you choose one over the other?",
      "How do you design a secure RESTful API authentication system using JSON Web Tokens (JWT) or session cookies?",
      "Explain the event loop in Node.js and how non-blocking asynchronous I/O operates under the hood.",
      "How do database indexes improve query execution speed, and what are the trade-offs of over-indexing a database?",
      "Describe how you handle state management and data caching in a modern web application."
    ],
    'Frontend Engineer': [
      "Explain the CSS Box Model, CSS Flexbox vs Grid, and how browser rendering optimization works.",
      "What are Closures and Event Delegation in JavaScript, and how do they impact performance?",
      "How do Virtual DOM diffing algorithms work in modern frontend frameworks like React or Vue?",
      "What strategies do you use for web performance optimization (Lighthouse, code splitting, lazy loading)?",
      "Explain how CORS (Cross-Origin Resource Sharing) works and how to resolve origin blocking errors."
    ],
    'Backend Engineer': [
      "How do you design database schemas to prevent deadlocks and ensure ACID compliance during high concurrency?",
      "Compare SQL relational databases (e.g., PostgreSQL, SQLite) vs NoSQL document stores (e.g., MongoDB).",
      "Explain the architectural differences between Microservices and Monolithic architectures.",
      "How do message queues (e.g., RabbitMQ, Kafka) help build decoupled, scalable distributed systems?",
      "Describe rate limiting algorithms (e.g., Token Bucket, Sliding Window) used in API gateway protection."
    ],
    'Data Scientist': [
      "Explain the difference between Overfitting and Underfitting in Machine Learning models, and how to prevent them.",
      "Compare Random Forests vs Gradient Boosting decision tree algorithms.",
      "How do precision, recall, F1-score, and ROC-AUC metrics differ in model evaluation?",
      "What steps do you take for feature engineering, data imputation, and handling missing data?",
      "Describe how gradient descent optimization algorithms adjust weights in neural networks."
    ],
    'DevOps & Cloud Engineer': [
      "Explain CI/CD pipeline automation and how Docker containerization differs from Virtual Machines.",
      "How does Kubernetes orchestrate container deployment, autoscaling, and self-healing?",
      "What is Infrastructure as Code (IaC) using Terraform, and why is state file management critical?",
      "Describe strategies for zero-downtime deployment (Blue/Green vs Canary deployments).",
      "How do you set up monitoring, log aggregation, and alerting using Prometheus and Grafana?"
    ],
    'Product Manager': [
      "How do you prioritize product backlog items using frameworks like RICE or MoSCoW?",
      "Describe a scenario where key stakeholders disagreed on product roadmap priorities. How did you align them?",
      "What metrics (KPIs) would you track to measure the success of a new user onboarding feature?",
      "How do you conduct customer discovery interviews and translate feedback into actionable requirements?",
      "Explain how you conduct A/B testing and analyze statistical significance before launching a feature."
    ]
  },
  HR: {
    General: [
      "Tell me about yourself, your background, and why you are interested in this target role.",
      "Describe a challenging technical project or conflict you faced in a team. How did you handle it?",
      "What is your greatest professional strength and one area you actively work to improve?",
      "Where do you see your career path evolving over the next 3 to 5 years?",
      "Why do you want to join our organization, and what unique value do you bring?"
    ]
  }
};

/**
 * POST /api/mock-interview/start
 * Creates a new mock interview session in SQLite with personalized resume-aware questions
 */
router.post('/start', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { targetRole, interviewType, difficulty } = req.body;

    const role = targetRole || 'Full Stack Developer';
    const type = interviewType || 'Technical';
    const diffInput = difficulty || 'Adaptive';

    // Generate personalized, non-repetitive resume-aware questions
    const { questions: selectedQuestions, effectiveDifficulty } = await generateResumeAwareQuestions(
      userId,
      role,
      type,
      diffInput,
      QUESTION_BANK
    );

    // Insert initial session in SQLite mock_interviews table
    const result = await dbAsync.run(
      `INSERT INTO mock_interviews (user_id, target_role, interview_type, difficulty, questions, answers, scores, feedback, final_score, strengths, weaknesses, suggestions, recommended_topics)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        role,
        type,
        effectiveDifficulty,
        JSON.stringify(selectedQuestions),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        0,
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([])
      ]
    );

    return res.json({
      success: true,
      sessionId: result.id,
      data: {
        sessionId: result.id,
        targetRole: role,
        interviewType: type,
        difficulty: effectiveDifficulty,
        questions: selectedQuestions
      }
    });
  } catch (error) {
    console.error('Start Mock Interview Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to start interview session.' });
  }
});

// GET /api/mock-interview/questions fallback support with resume-aware question generation
router.get('/questions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { targetRole, interviewType, difficulty } = req.query;

    const role = targetRole || 'Full Stack Developer';
    const type = interviewType || 'Technical';
    const diffInput = difficulty || 'Adaptive';

    const { questions: selectedQuestions, effectiveDifficulty } = await generateResumeAwareQuestions(
      userId,
      role,
      type,
      diffInput,
      QUESTION_BANK
    );

    const result = await dbAsync.run(
      `INSERT INTO mock_interviews (user_id, target_role, interview_type, difficulty, questions, answers, scores, feedback, final_score, strengths, weaknesses, suggestions, recommended_topics)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        role,
        type,
        effectiveDifficulty,
        JSON.stringify(selectedQuestions),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        0,
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([])
      ]
    );

    return res.json({
      success: true,
      sessionId: result.id,
      data: {
        sessionId: result.id,
        targetRole: role,
        interviewType: type,
        difficulty: effectiveDifficulty,
        questions: selectedQuestions
      }
    });
  } catch (error) {
    console.error('Start Mock Interview Questions Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate interview questions.' });
  }
});


/**
 * POST /api/mock-interview/evaluate-answer
 * Evaluates individual student answer for Relevance, Accuracy, Technical Knowledge, Communication, & Completeness
 */
router.post('/evaluate-answer', requireAuth, async (req, res) => {
  try {
    const { targetRole, interviewType, difficulty, questionText, studentAnswer } = req.body;

    if (!questionText || !studentAnswer) {
      return res.status(400).json({ success: false, error: 'Question text and student answer are required.' });
    }

    const answerStr = studentAnswer.trim();
    if (answerStr.length < 5) {
      return res.json({
        success: true,
        evaluation: {
          score: 25,
          relevance: 30,
          accuracy: 20,
          communication: 25,
          completeness: 20,
          feedback: "Answer is extremely short. Please elaborate with detailed explanations, technical concepts, and practical examples."
        }
      });
    }

    // Attempt Backend AI API Evaluation via Gemini if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here' && !apiKey.startsWith('AIzaSy_demo')) {
      try {
        const aiEval = await callGeminiAIEvaluator(apiKey, questionText, answerStr, targetRole, interviewType);
        if (aiEval) {
          const enriched = enrichMockAnswerEvaluation(aiEval, questionText, answerStr);
          return res.json({ success: true, evaluation: enriched });
        }
      } catch (err) {
        console.log('Gemini API call note (using fallback NLP evaluator):', err.message);
      }
    }

    // Fallback Intelligent NLP Evaluator
    const fallbackEval = runFallbackNLPEvaluation(questionText, answerStr, interviewType);
    const enrichedFallback = enrichMockAnswerEvaluation(fallbackEval, questionText, answerStr);
    return res.json({ success: true, evaluation: enrichedFallback });

  } catch (error) {
    console.error('Evaluate Answer Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to evaluate answer.' });
  }
});

/**
 * POST /api/mock-interview/finish
 * Calculates final report scores, strengths, weaknesses, suggestions, recommended topics, and saves attempt in SQLite
 */
router.post('/finish', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { targetRole, interviewType, difficulty, questions, answers, evaluations } = req.body;

    if (!questions || !answers || !evaluations || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'Invalid interview completion payload.' });
    }

    const scores = evaluations.map(e => e.score || 70);
    const sumScores = scores.reduce((a, b) => a + b, 0);
    const finalScore = Math.round(sumScores / Math.max(1, scores.length));

    // Generate Strengths, Weaknesses, Suggestions, & Recommended Topics
    const strengths = [];
    const weaknesses = [];
    const suggestions = [];
    const recommendedTopics = [];

    if (finalScore >= 80) {
      strengths.push("Excellent technical clarity and well-structured answer explanations.");
      strengths.push("Demonstrated strong domain knowledge and practical problem-solving capability.");
      suggestions.push("Focus on system architecture scaling details for senior-level interviews.");
      recommendedTopics.push("Advanced System Architecture", "Low-Level Performance Tuning");
    } else if (finalScore >= 60) {
      strengths.push("Solid understanding of core software concepts and functional requirements.");
      weaknesses.push("Some answers lacked detailed real-world architectural examples.");
      suggestions.push("Incorporate real-life project examples and edge-case handling in responses.");
      recommendedTopics.push("Design Patterns", "Database Indexing & Caching", "REST API Security");
    } else {
      strengths.push("Good effort attempting questions across core technical areas.");
      weaknesses.push("Answers were brief and missing fundamental technical depth.");
      suggestions.push("Use the STAR technique (Situation, Task, Action, Result) for structured responses.");
      recommendedTopics.push("Data Structures & Algorithms", "Core Language Fundamentals", "Web Architecture Basics");
    }

    const role = targetRole || 'Full Stack Developer';
    const type = interviewType || 'Technical';
    const diff = difficulty || 'Medium';

    let attemptId = req.body.sessionId;
    let attemptResult;

    if (attemptId) {
      const updateRes = await dbAsync.run(
        `UPDATE mock_interviews SET
           target_role = ?,
           interview_type = ?,
           difficulty = ?,
           questions = ?,
           answers = ?,
           scores = ?,
           feedback = ?,
           final_score = ?,
           strengths = ?,
           weaknesses = ?,
           suggestions = ?,
           recommended_topics = ?
         WHERE id = ? AND user_id = ?`,
        [
          role,
          type,
          diff,
          JSON.stringify(questions),
          JSON.stringify(answers),
          JSON.stringify(scores),
          JSON.stringify(evaluations),
          finalScore,
          JSON.stringify(strengths),
          JSON.stringify(weaknesses),
          JSON.stringify(suggestions),
          JSON.stringify(recommendedTopics),
          attemptId,
          userId
        ]
      );
      if (updateRes.changes > 0) {
        attemptResult = { id: attemptId };
      }
    }

    if (!attemptResult) {
      attemptResult = await dbAsync.run(
        `INSERT INTO mock_interviews (user_id, target_role, interview_type, difficulty, questions, answers, scores, feedback, final_score, strengths, weaknesses, suggestions, recommended_topics)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          role,
          type,
          diff,
          JSON.stringify(questions),
          JSON.stringify(answers),
          JSON.stringify(scores),
          JSON.stringify(evaluations),
          finalScore,
          JSON.stringify(strengths),
          JSON.stringify(weaknesses),
          JSON.stringify(suggestions),
          JSON.stringify(recommendedTopics)
        ]
      );
    }

    // Update user stats in student_stats
    const userStats = await dbAsync.get('SELECT * FROM student_stats WHERE user_id = ?', [userId]);
    if (userStats) {
      const newHours = Math.round((userStats.practice_hours + 0.8) * 10) / 10;
      const newInterviews = userStats.interviews_completed + 1;
      const newTopics = Math.min(12, userStats.topics_mastered + 1);
      await dbAsync.run(
        'UPDATE student_stats SET practice_hours = ?, interviews_completed = ?, topics_mastered = ?, last_practice_date = CURRENT_TIMESTAMP WHERE user_id = ?',
        [newHours, newInterviews, newTopics, userId]
      );
    }


    return res.json({
      success: true,
      data: {
        attemptId: attemptResult.id,
        targetRole: role,
        interviewType: type,
        difficulty: diff,
        finalScore,
        scores,
        evaluations,
        strengths,
        weaknesses,
        suggestions,
        recommendedTopics
      }
    });

  } catch (error) {
    console.error('Finish Mock Interview Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to complete mock interview session.' });
  }
});

/**
 * GET /api/mock-interview/history
 * Fetches user's past mock interview reports
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const interviews = await dbAsync.all(
      'SELECT id, target_role, interview_type, difficulty, final_score, created_at FROM mock_interviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    return res.json({
      success: true,
      interviews
    });
  } catch (error) {
    console.error('Fetch Mock History Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve mock interview history.' });
  }
});

/**
 * Safe Backend Fallback NLP Evaluator
 */
function runFallbackNLPEvaluation(question, answer, interviewType) {
  const words = answer.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  let relevance = 70;
  let accuracy = 75;
  let communication = 70;
  let completeness = 65;

  if (wordCount > 60) {
    communication += 15;
    completeness += 20;
    relevance += 10;
  } else if (wordCount > 30) {
    communication += 10;
    completeness += 10;
  } else if (wordCount < 15) {
    communication -= 15;
    completeness -= 20;
  }

  // Check for technical keyword presence
  const techKeywords = ['architecture', 'security', 'database', 'performance', 'api', 'state', 'process', 'async', 'index', 'function', 'class', 'design', 'service'];
  let keywordMatches = 0;
  techKeywords.forEach(kw => {
    if (answer.toLowerCase().includes(kw)) keywordMatches++;
  });

  if (keywordMatches >= 3) {
    accuracy += 15;
    relevance += 10;
  } else if (keywordMatches >= 1) {
    accuracy += 5;
  }

  relevance = Math.min(95, Math.max(35, relevance));
  accuracy = Math.min(95, Math.max(35, accuracy));
  communication = Math.min(95, Math.max(35, communication));
  completeness = Math.min(95, Math.max(35, completeness));

  const overallScore = Math.round((relevance + accuracy + communication + completeness) / 4);

  let feedback = "";
  if (overallScore >= 85) {
    feedback = "Excellent response! Clear technical explanation with strong vocabulary and complete structural coverage.";
  } else if (overallScore >= 70) {
    feedback = "Good answer. Concepts are clear, but adding concrete real-world implementation examples would make it stronger.";
  } else {
    feedback = "Adequate answer. Try to elaborate further on core mechanisms and use domain-specific technical terminology.";
  }

  return {
    score: overallScore,
    relevance,
    accuracy,
    communication,
    completeness,
    feedback
  };
}

/**
 * Helper to call Gemini API securely from Backend
 */
function callGeminiAIEvaluator(apiKey, question, answer, role, type) {
  return new Promise((resolve) => {
    const promptText = `
You are an expert technical interviewer evaluating a job candidate for the role of '${role}' (${type} Interview).
Question: "${question}"
Candidate Answer: "${answer}"

Evaluate the answer and return ONLY a valid JSON object with these exact keys:
{
  "score": integer between 0 and 100,
  "relevance": integer between 0 and 100,
  "accuracy": integer between 0 and 100,
  "communication": integer between 0 and 100,
  "completeness": integer between 0 and 100,
  "feedback": "a concise 2-sentence feedback string"
}
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
      timeout: 4000
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
            const evalObj = JSON.parse(cleanJsonStr);
            return resolve(evalObj);
          }
        } catch (e) {
          return resolve(null);
        }
        resolve(null);
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

module.exports = router;

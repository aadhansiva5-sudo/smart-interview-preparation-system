const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const https = require('https');
const pdfParse = require('pdf-parse');
const { dbAsync } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { extractSkillsFromText } = require('../services/skillExtractor');
const { upsertStudentSkills } = require('../services/skillProfileService');

const router = express.Router();

// Ensure secure uploads directory exists (outside public folder)
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${req.session.userId}-${uniqueSuffix}${ext}`);
  }
});

// File Filter & Validation (PDF & DOCX, Max 5MB)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF (.pdf) and Word (.docx) documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Role-specific Skill Profiles
const ROLE_SKILL_PROFILES = {
  'Full Stack Developer': [
    'JavaScript', 'TypeScript', 'Node.js', 'Express', 'React', 'Vue', 'HTML', 'CSS',
    'SQL', 'MongoDB', 'REST API', 'Git', 'Docker', 'CI/CD', 'AWS', 'Python'
  ],
  'Frontend Engineer': [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'HTML5', 'CSS3', 'Sass',
    'Tailwind', 'Webpack', 'Vite', 'Redux', 'REST API', 'GraphQL', 'Jest', 'Git'
  ],
  'Backend Engineer': [
    'Node.js', 'Python', 'Java', 'Go', 'Express', 'Django', 'Spring Boot', 'SQL',
    'PostgreSQL', 'MongoDB', 'Redis', 'REST API', 'Microservices', 'Docker', 'Kubernetes', 'Kafka'
  ],
  'Data Scientist': [
    'Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-Learn', 'TensorFlow', 'PyTorch',
    'Machine Learning', 'Deep Learning', 'Data Visualization', 'Matplotlib', 'Statistics', 'Jupyter'
  ],
  'DevOps & Cloud Engineer': [
    'Docker', 'Kubernetes', 'Terraform', 'AWS', 'Azure', 'GCP', 'Linux', 'Bash',
    'Python', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Prometheus', 'Grafana', 'Ansible'
  ],
  'Product Manager': [
    'Product Strategy', 'Roadmapping', 'Agile', 'Scrum', 'User Research', 'Data Analytics',
    'A/B Testing', 'SQL', 'Jira', 'KPIs', 'Customer Discovery', 'Prioritization', 'Wireframing'
  ]
};

/**
 * Extract raw text from PDF or DOCX file
 */
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    try {
      const data = await pdfParse(fileBuffer);
      if (data && data.text && data.text.trim().length > 10) {
        return data.text;
      }
    } catch (err) {
      console.log('PDF parse warning, using fallback buffer parser:', err.message);
    }
    // Fallback PDF text extraction
    return fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  } else if (ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      if (result && result.value && result.value.trim().length > 10) {
        return result.value;
      }
    } catch (err) {
      console.log('Mammoth parse warning, using fallback buffer parser:', err.message);
    }
    // Fallback DOCX text extraction
    return fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  }

  return fileBuffer.toString('utf-8');
}

/**
 * POST /api/resume/analyze
 * Handles resume upload, validates file, extracts text, performs analysis, and stores in SQLite
 */
router.post('/analyze', requireAuth, (req, res) => {
  upload.single('resumeFile')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, error: 'File size exceeds 5MB limit. Please upload a smaller file.' });
        }
      }
      return res.status(400).json({ success: false, error: err.message || 'File upload error.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a PDF or DOCX resume file to upload.' });
    }

    const userId = req.session.userId;
    const { targetRole } = req.body;
    const role = targetRole || 'Full Stack Developer';
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const storedFilename = req.file.filename;

    try {
      // 1. Extract text from uploaded resume
      const extractedText = await extractTextFromFile(filePath, originalName);

      // 2. Perform Resume Analysis
      let analysisResult = null;
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== 'your_gemini_api_key_here' && !apiKey.startsWith('AIzaSy_demo')) {
        try {
          analysisResult = await callGeminiResumeAnalyzer(apiKey, extractedText, role);
        } catch (aiErr) {
          console.log('Gemini API resume analysis fallback note:', aiErr.message);
        }
      }

      if (!analysisResult) {
        analysisResult = runFallbackNLPResumeAnalysis(extractedText, role);
      }

      // Extract canonical structured skills & synchronize with student skill profile
      const structuredSkills = await extractSkillsFromText(extractedText, role);
      analysisResult.structuredSkills = structuredSkills;
      await upsertStudentSkills(userId, structuredSkills, 'resume');

      const score = analysisResult.score || 75;
      const matchPercentage = analysisResult.matchPercentage || 75;

      // 3. Store Analysis in SQLite Database
      const result = await dbAsync.run(
        `INSERT INTO resume_analyses (user_id, filename, stored_filename, target_role, score, match_percentage, analysis_result)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          originalName,
          storedFilename,
          role,
          score,
          matchPercentage,
          JSON.stringify(analysisResult)
        ]
      );

      // Update student_stats practice metrics
      const userStats = await dbAsync.get('SELECT * FROM student_stats WHERE user_id = ?', [userId]);
      if (userStats) {
        const newHours = Math.round((userStats.practice_hours + 0.5) * 10) / 10;
        const newTopics = Math.min(12, userStats.topics_mastered + 1);
        await dbAsync.run(
          'UPDATE student_stats SET practice_hours = ?, topics_mastered = ?, last_practice_date = CURRENT_TIMESTAMP WHERE user_id = ?',
          [newHours, newTopics, userId]
        );
      }

      return res.json({
        success: true,
        data: {
          id: result.id,
          filename: originalName,
          targetRole: role,
          score,
          matchPercentage,
          analysis: analysisResult,
          createdAt: new Date()
        }
      });

    } catch (error) {
      console.error('Resume Analysis Error:', error);
      // Clean up uploaded file if processing failed
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(500).json({ success: false, error: 'Failed to analyze uploaded resume.' });
    }
  });
});

/**
 * GET /api/resume/history
 * Retrieves student's previous resume analyses history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const history = await dbAsync.all(
      `SELECT id, filename, target_role, score, match_percentage, created_at
       FROM resume_analyses
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 15`,
      [userId]
    );

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Fetch Resume History Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve resume history.' });
  }
});

/**
 * GET /api/resume/history/:id
 * Retrieves detailed result for a specific past resume analysis
 */
router.get('/history/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const record = await dbAsync.get(
      `SELECT * FROM resume_analyses WHERE id = ? AND user_id = ?`,
      [req.params.id, userId]
    );

    if (!record) {
      return res.status(404).json({ success: false, error: 'Resume analysis record not found.' });
    }

    return res.json({
      success: true,
      data: {
        id: record.id,
        filename: record.filename,
        targetRole: record.target_role,
        score: record.score,
        matchPercentage: record.match_percentage,
        analysis: JSON.parse(record.analysis_result),
        createdAt: record.created_at
      }
    });
  } catch (error) {
    console.error('Fetch Resume Detail Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load resume details.' });
  }
});

/**
 * Intelligent Fallback NLP Resume Analyzer
 */
function runFallbackNLPResumeAnalysis(text, role) {
  const targetSkills = ROLE_SKILL_PROFILES[role] || ROLE_SKILL_PROFILES['Full Stack Developer'];
  const lowerText = text.toLowerCase();

  const detectedSkills = [];
  const missingSkills = [];

  targetSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      detectedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Calculate Match Percentage
  const matchPct = Math.round((detectedSkills.length / Math.max(1, targetSkills.length)) * 100);

  // General Resume Quality Signals
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
  const hasPhone = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\+\d{1,3}/.test(text);
  const hasEducation = /education|university|degree|bachelor|master|b\.tech|bs|ms/i.test(text);
  const hasExperience = /experience|projects|internship|work|developed|built|managed/i.test(text);

  let qualityBonus = 0;
  if (hasEmail) qualityBonus += 5;
  if (hasPhone) qualityBonus += 5;
  if (hasEducation) qualityBonus += 10;
  if (hasExperience) qualityBonus += 10;

  const score = Math.min(98, Math.max(40, Math.round(matchPct * 0.7 + qualityBonus)));

  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (detectedSkills.length > 0) {
    strengths.push(`Identified key relevant domain skills: ${detectedSkills.slice(0, 4).join(', ')}.`);
  } else {
    strengths.push("Resume format is readable and structure was parsed successfully.");
  }

  if (hasExperience) {
    strengths.push("Includes clear project or professional experience descriptions.");
  }
  if (hasEducation) {
    strengths.push("Educational background and academic credentials are documented.");
  }

  if (missingSkills.length > 0) {
    weaknesses.push(`Missing critical target role skills: ${missingSkills.slice(0, 4).join(', ')}.`);
  }
  if (!hasPhone || !hasEmail) {
    weaknesses.push("Contact header missing clear phone number or email address.");
  }
  if (text.length < 300) {
    weaknesses.push("Resume content is short; details regarding technical impact and achievements appear limited.");
  }

  suggestions.push(`Highlight key skills required for ${role} like ${missingSkills.slice(0, 3).join(', ')}.`);
  suggestions.push("Use action verbs (e.g., 'Engineered', 'Optimized', 'Architected') and quantify achievements with metrics (e.g., 'improved performance by 30%').");
  suggestions.push("Tailor your summary section to directly align with the core competencies of a " + role + ".");

  const keywords = [...detectedSkills, ...targetSkills.slice(0, 3)];

  return {
    score,
    matchPercentage: matchPct,
    detectedSkills,
    missingSkills,
    strengths,
    weaknesses,
    keywords,
    suggestions
  };
}

/**
 * Gemini AI API Resume Analyzer Call
 */
function callGeminiResumeAnalyzer(apiKey, text, role) {
  return new Promise((resolve) => {
    const promptText = `
You are an expert technical recruiter and resume parser analyzing a resume for the target role of '${role}'.
Resume Content:
"""
${text.slice(0, 3500)}
"""

Analyze this resume against '${role}' and return ONLY a valid JSON object with these exact keys:
{
  "score": integer 0-100,
  "matchPercentage": integer 0-100,
  "detectedSkills": [array of string skills found in resume],
  "missingSkills": [array of string important skills for ${role} missing in resume],
  "strengths": [array of 2-3 string strengths],
  "weaknesses": [array of 2-3 string weaknesses],
  "keywords": [array of 4-6 relevant industry keywords],
  "suggestions": [array of 3 actionable improvement suggestions]
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
      timeout: 5000
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

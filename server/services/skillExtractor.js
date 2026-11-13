const https = require('https');

// Canonical Taxonomy & Alias Dictionary
const CANONICAL_TAXONOMY = {
  // Languages
  'javascript': { name: 'JavaScript', category: 'Languages' },
  'js': { name: 'JavaScript', category: 'Languages' },
  'typescript': { name: 'TypeScript', category: 'Languages' },
  'ts': { name: 'TypeScript', category: 'Languages' },
  'python': { name: 'Python', category: 'Languages' },
  'py': { name: 'Python', category: 'Languages' },
  'java': { name: 'Java', category: 'Languages' },
  'c++': { name: 'C++', category: 'Languages' },
  'cpp': { name: 'C++', category: 'Languages' },
  'c#': { name: 'C#', category: 'Languages' },
  'csharp': { name: 'C#', category: 'Languages' },
  'golang': { name: 'Go', category: 'Languages' },
  'go': { name: 'Go', category: 'Languages' },
  'html': { name: 'HTML5', category: 'Languages' },
  'html5': { name: 'HTML5', category: 'Languages' },
  'css': { name: 'CSS3', category: 'Languages' },
  'css3': { name: 'CSS3', category: 'Languages' },
  'sql': { name: 'SQL', category: 'Languages' },

  // Frameworks & Libraries
  'react': { name: 'React', category: 'Frameworks & Libraries' },
  'reactjs': { name: 'React', category: 'Frameworks & Libraries' },
  'vue': { name: 'Vue.js', category: 'Frameworks & Libraries' },
  'vuejs': { name: 'Vue.js', category: 'Frameworks & Libraries' },
  'node': { name: 'Node.js', category: 'Frameworks & Libraries' },
  'nodejs': { name: 'Node.js', category: 'Frameworks & Libraries' },
  'express': { name: 'Express.js', category: 'Frameworks & Libraries' },
  'expressjs': { name: 'Express.js', category: 'Frameworks & Libraries' },
  'django': { name: 'Django', category: 'Frameworks & Libraries' },
  'flask': { name: 'Flask', category: 'Frameworks & Libraries' },
  'spring boot': { name: 'Spring Boot', category: 'Frameworks & Libraries' },
  'spring': { name: 'Spring Boot', category: 'Frameworks & Libraries' },
  'angular': { name: 'Angular', category: 'Frameworks & Libraries' },
  'redux': { name: 'Redux', category: 'Frameworks & Libraries' },
  'tailwind': { name: 'Tailwind CSS', category: 'Frameworks & Libraries' },

  // Databases
  'mongodb': { name: 'MongoDB', category: 'Databases' },
  'mongo': { name: 'MongoDB', category: 'Databases' },
  'postgresql': { name: 'PostgreSQL', category: 'Databases' },
  'postgres': { name: 'PostgreSQL', category: 'Databases' },
  'mysql': { name: 'MySQL', category: 'Databases' },
  'sqlite': { name: 'SQLite', category: 'Databases' },
  'redis': { name: 'Redis', category: 'Databases' },

  // DevOps & Cloud
  'docker': { name: 'Docker', category: 'DevOps & Cloud' },
  'kubernetes': { name: 'Kubernetes', category: 'DevOps & Cloud' },
  'k8s': { name: 'Kubernetes', category: 'DevOps & Cloud' },
  'aws': { name: 'AWS', category: 'DevOps & Cloud' },
  'amazon web services': { name: 'AWS', category: 'DevOps & Cloud' },
  'terraform': { name: 'Terraform', category: 'DevOps & Cloud' },
  'ci/cd': { name: 'CI/CD', category: 'DevOps & Cloud' },
  'linux': { name: 'Linux', category: 'DevOps & Cloud' },

  // Architecture & Concepts
  'rest api': { name: 'REST API', category: 'Architecture & Concepts' },
  'restful': { name: 'REST API', category: 'Architecture & Concepts' },
  'microservices': { name: 'Microservices', category: 'Architecture & Concepts' },
  'graphql': { name: 'GraphQL', category: 'Architecture & Concepts' },
  'data structures': { name: 'Data Structures', category: 'Architecture & Concepts' },
  'algorithms': { name: 'Algorithms', category: 'Architecture & Concepts' },

  // Developer Tools
  'git': { name: 'Git', category: 'Developer Tools' },
  'github': { name: 'GitHub', category: 'Developer Tools' },
  'jira': { name: 'Jira', category: 'Developer Tools' },
  'vite': { name: 'Vite', category: 'Developer Tools' },
  'webpack': { name: 'Webpack', category: 'Developer Tools' }
};

/**
 * Main Extract Function
 * @param {string} text - Raw extracted resume or project text
 * @param {string} targetRole - User's target role
 * @returns {Promise<Array<{name: string, category: string, proficiency: number, confidence: number, verified: number}>>}
 */
async function extractSkillsFromText(text, targetRole = 'Full Stack Developer') {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your_gemini_api_key_here' && !apiKey.startsWith('AIzaSy_demo')) {
    try {
      const aiSkills = await callGeminiSkillExtractor(apiKey, text, targetRole);
      if (aiSkills && Array.isArray(aiSkills) && aiSkills.length > 0) {
        return normalizeExtractedSkills(aiSkills);
      }
    } catch (err) {
      console.log('Gemini Skill Extraction fallback note:', err.message);
    }
  }

  // Fallback Deterministic Taxonomy Extractor
  return fallbackTaxonomyExtractor(text);
}

/**
 * Fallback Regex Extractor using CANONICAL_TAXONOMY
 */
function fallbackTaxonomyExtractor(text) {
  const lowerText = text.toLowerCase();
  const foundMap = new Map();

  // Check for seniority/experience signals
  const isSenior = /senior|lead|architect|principal|5\+\s*years|expert/i.test(text);
  const baseProficiency = isSenior ? 82 : 70;

  Object.keys(CANONICAL_TAXONOMY).forEach(alias => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\b|\\s)${escaped}(?:\\b|\\s|$)`, 'i');

    if (regex.test(lowerText)) {
      const canonical = CANONICAL_TAXONOMY[alias];
      if (!foundMap.has(canonical.name)) {
        foundMap.set(canonical.name, {
          name: canonical.name,
          category: canonical.category,
          proficiency: baseProficiency,
          confidence: 0.60,
          verified: 0
        });
      }
    }
  });

  return Array.from(foundMap.values());
}

/**
 * Normalizes AI output against canonical names
 */
function normalizeExtractedSkills(rawSkills) {
  return rawSkills.map(item => {
    const key = (item.name || '').toLowerCase().trim();
    const canonical = CANONICAL_TAXONOMY[key];

    return {
      name: canonical ? canonical.name : (item.name || 'General Skill'),
      category: canonical ? canonical.category : (item.category || 'General'),
      proficiency: Math.min(100, Math.max(30, parseInt(item.proficiency || 70, 10))),
      confidence: item.confidence || 0.60,
      verified: 0
    };
  });
}

/**
 * Gemini AI Structured Skill Extractor
 */
function callGeminiSkillExtractor(apiKey, text, role) {
  return new Promise((resolve) => {
    const promptText = `
You are an expert technical recruiter and resume parser.
Extract all technical skills, programming languages, frameworks, databases, cloud tools, and core CS concepts from this text for a '${role}'.

Text Content:
"""
${text.slice(0, 3500)}
"""

Return ONLY a valid JSON array of objects with exact keys:
[
  {
    "name": "Canonical Skill Name",
    "category": "One of: Languages, Frameworks & Libraries, Databases, DevOps & Cloud, Architecture & Concepts, Developer Tools",
    "proficiency": integer between 40 and 95 based on depth of mentions,
    "confidence": 0.60
  }
]
`;

    const postData = JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] });

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
            const arr = JSON.parse(cleanJsonStr);
            return resolve(arr);
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

module.exports = {
  extractSkillsFromText,
  fallbackTaxonomyExtractor,
  CANONICAL_TAXONOMY
};

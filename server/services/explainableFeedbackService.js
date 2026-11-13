const https = require('https');

/**
 * Feature flag checker for Explainable AI Feedback
 */
function isExplainableFeedbackEnabled() {
  return process.env.ENABLE_EXPLAINABLE_FEEDBACK !== 'false';
}

/**
 * Generate Explainable Feedback for Coding Submissions
 * @param {string} userCode 
 * @param {Object} evaluation - Output from runSandboxedPython
 * @param {Object} question - Coding question row from DB
 * @returns {Promise<Object>}
 */
async function generateCodingFeedback(userCode, evaluation, question) {
  if (!isExplainableFeedbackEnabled()) return null;

  const isAccepted = evaluation.status === 'Accepted';
  const failedResults = (evaluation.testResults || []).filter(r => !r.passed);

  let explanation = "";
  let weakConcepts = [];
  let improvementTips = [];

  if (isAccepted) {
    explanation = "Your solution passed all test cases! The function structure, return values, and edge case logic were correctly executed.";
    improvementTips.push("Try optimizing your solution for time and space complexity.");
    improvementTips.push("Consider writing extra edge-case tests (e.g. empty input, extreme boundary values).");
  } else if (evaluation.status === 'Syntax Error') {
    explanation = evaluation.log || "Syntax or security restriction detected. Check your function definition and statements.";
    weakConcepts.push("Syntax & Language Rules");
    improvementTips.push("Ensure your solution defines a standard function with 'def' and uses proper return statements.");
  } else {
    explanation = `Your solution failed ${failedResults.length} test case(s). Review the expected vs actual outputs below.`;
    
    // Concept identification based on category & title
    const category = question?.category || 'Algorithms';
    weakConcepts.push(category);

    if (userCode.includes('len(') || userCode.includes('range(')) {
      weakConcepts.push("Off-by-one / Index Boundary Errors");
    }
    if (!userCode.includes('if')) {
      weakConcepts.push("Conditional Edge Case Handling");
    }

    improvementTips.push("Trace your code manually using the first failed test case input.");
    improvementTips.push("Check if your code handles special cases like empty strings, zeros, or negative numbers.");
  }

  return {
    isAccepted,
    statusSummary: evaluation.status,
    explanation,
    weakConcepts,
    improvementTips,
    failedTestCaseCount: failedResults.length,
    failedSample: failedResults.length > 0 ? failedResults[0] : null
  };
}

/**
 * Generate Progressive Hint for a Coding Question without revealing full solution
 * @param {Object} question 
 * @param {string} userCode 
 * @param {number} hintLevel - 1 (Conceptual) or 2 (Implementation strategy)
 * @returns {Promise<Object>}
 */
async function generateCodingHint(question, userCode = '', hintLevel = 1) {
  const title = question?.title || 'Coding Problem';
  const category = question?.category || 'Algorithms';

  const level1Hints = {
    'Reverse a String': "Think about how strings can be converted into lists, reversed, or iterated backward from index `len(s) - 1` to `0`.",
    'Palindrome Check': "A palindrome reads the same forward and backward. Try comparing the original cleaned string with its reverse.",
    'Prime Number Check': "A prime number is greater than 1 and has no divisors other than 1 and itself. You only need to check divisors up to `sqrt(n)`.",
    'Fibonacci Series': "The Fibonacci sequence starts with `[0, 1]`. Each subsequent term is the sum of the previous two terms (`fib[i-1] + fib[i-2]`).",
    'Factorial of a Number': "Factorial of `n` is `1 * 2 * 3 * ... * n`. Remember that `0!` equals `1`.",
    'Largest Number in List': "You can iterate through the list keeping track of the current maximum, or use Python's built-in `max()` function.",
    'Count Vowels in String': "Iterate through each character in the string and check if it exists in the set of vowels `'aeiouAEIOU'`.",
    'Sum of Array Elements': "You can loop through all elements accumulating the total, or use Python's built-in `sum()` function.",
    'Even or Odd Check': "Use the modulo operator `%`. An integer is even if `n % 2 == 0`.",
    'Remove Duplicates from List': "You can maintain a list of seen elements in order, or convert to a Python `set()` / `dict.fromkeys()`."
  };

  const level2Hints = {
    'Reverse a String': "In Python, you can reverse a string using slice syntax `s[::-1]`, or `''.join(reversed(s))`.",
    'Palindrome Check': "Compare `s.lower() == s.lower()[::-1]` and return the boolean result directly.",
    'Prime Number Check': "If `n <= 1`, return `False`. For `i` from `2` to `int(n**0.5) + 1`, if `n % i == 0`, return `False`. If no divisor found, return `True`.",
    'Fibonacci Series': "Initialize `seq = [0, 1]`. Use a loop `while len(seq) < n:` appending `seq[-1] + seq[-2]`. Handle cases where `n <= 0` or `n == 1`.",
    'Factorial of a Number': "Initialize `result = 1`. Loop `for i in range(2, n + 1): result *= i`. Return `result`.",
    'Largest Number in List': "Return `max(numbers)` directly after verifying the list is non-empty.",
    'Count Vowels in String': "Use a list comprehension or generator: `return sum(1 for char in s if char.lower() in 'aeiou')`.",
    'Sum of Array Elements': "Return `sum(arr)` directly.",
    'Even or Odd Check': "Return `'Even' if number % 2 == 0 else 'Odd'`.",
    'Remove Duplicates from List': "Use `list(dict.fromkeys(lst))` to remove duplicates while preserving original order."
  };

  const hintText = hintLevel === 2
    ? (level2Hints[title] || `Strategy for ${category}: Break down the logic into distinct steps and ensure all branches return a concrete value.`)
    : (level1Hints[title] || `Conceptual Nudge for ${category}: Carefully review the problem description and test inputs.`);

  return {
    questionId: question?.id,
    hintLevel,
    hint: hintText
  };
}

/**
 * Generate Step-by-Step Explainable Feedback for Aptitude Test Submissions
 * @param {Array<Object>} questionResults 
 * @param {Array<Object>} pastAttempts 
 * @returns {Object}
 */
function generateAptitudeFeedback(questionResults, pastAttempts = []) {
  if (!isExplainableFeedbackEnabled()) return null;

  const weakCategoriesMap = {};
  questionResults.forEach(q => {
    if (!q.isCorrect) {
      const cat = q.category || 'General';
      weakCategoriesMap[cat] = (weakCategoriesMap[cat] || 0) + 1;
    }
  });

  const weakTopics = Object.keys(weakCategoriesMap);

  let overallSummary = "";
  const wrongCount = questionResults.filter(q => !q.isCorrect).length;

  if (wrongCount === 0) {
    overallSummary = "Perfect score! Outstanding mastery of quantitative, logical, and verbal concepts.";
  } else if (wrongCount <= 3) {
    overallSummary = `Great attempt! You correctly answered ${questionResults.length - wrongCount} out of ${questionResults.length} questions. Review the step-by-step solutions for the missed questions.`;
  } else {
    overallSummary = `You missed ${wrongCount} questions. Focus your study on: ${weakTopics.join(', ') || 'Core Aptitude Topics'}.`;
  }

  return {
    overallSummary,
    weakTopics,
    explanations: questionResults.map(q => ({
      questionId: q.questionId,
      isCorrect: q.isCorrect,
      explanation: q.explanation || "Step-by-step explanation for this question.",
      correctAnswer: q.correctAnswer
    }))
  };
}

/**
 * Generate Explainable Feedback for Technical Practice Submissions
 * @param {Array<Object>} questionResults 
 * @returns {Object}
 */
function generateTechnicalFeedback(questionResults) {
  if (!isExplainableFeedbackEnabled()) return null;

  const missedByTopic = {};
  questionResults.forEach(q => {
    if (!q.isCorrect) {
      const cat = q.category || 'General Technical';
      missedByTopic[cat] = (missedByTopic[cat] || 0) + 1;
    }
  });

  const knowledgeGaps = Object.keys(missedByTopic);
  const recommendedTopics = knowledgeGaps.map(gap => `${gap} Core Concepts & Best Practices`);

  let summary = "";
  const correctCount = questionResults.filter(q => q.isCorrect).length;
  const pct = Math.round((correctCount / Math.max(1, questionResults.length)) * 100);

  if (pct >= 80) {
    summary = "Strong technical proficiency demonstrated! You showed solid understanding of fundamental software engineering concepts.";
  } else if (pct >= 50) {
    summary = `Moderate performance (${pct}%). Review the specific domain knowledge gaps listed below to solidify your technical foundation.`;
  } else {
    summary = `Needs improvement (${pct}%). We recommend dedicated review in: ${knowledgeGaps.join(', ') || 'Technical Fundamentals'}.`;
  }

  return {
    summary,
    knowledgeGaps,
    recommendedTopics,
    itemExplanations: questionResults.map(q => ({
      questionId: q.questionId,
      isCorrect: q.isCorrect,
      selected: q.selectedOption,
      correct: q.correctAnswer,
      explanation: q.explanation
    }))
  };
}

/**
 * Enrich Individual Mock Interview Answer Evaluation with Multi-Metric Explanations
 * @param {Object} evalObj 
 * @param {string} questionText 
 * @param {string} studentAnswer 
 * @returns {Object}
 */
function enrichMockAnswerEvaluation(evalObj, questionText, studentAnswer) {
  if (!evalObj) return evalObj;

  const rel = evalObj.relevance || 70;
  const acc = evalObj.accuracy || 70;
  const comm = evalObj.communication || 70;
  const comp = evalObj.completeness || 70;

  const rubricBreakdown = {
    relevance: {
      score: rel,
      insight: rel >= 80 ? "Directly answers the interviewer's core question." : "Partially addresses the question; ensure you stay focused on the specific topic requested."
    },
    accuracy: {
      score: acc,
      insight: acc >= 80 ? "Demonstrates strong technical precision and correct domain terminology." : "Includes basic concepts but missing key technical mechanisms or terms."
    },
    communication: {
      score: comm,
      insight: comm >= 80 ? "Clear, structured, and easy to follow." : "Answer is somewhat brief or lacks logical flow. Try using the STAR approach."
    },
    completeness: {
      score: comp,
      insight: comp >= 80 ? "Comprehensive coverage including practical examples and architecture." : "Omits real-world examples or implementation details."
    }
  };

  return {
    ...evalObj,
    rubricBreakdown
  };
}

/**
 * Attach Knowledge Tracing trend insights to a feedback object when sufficient assessment evidence exists.
 * @param {number} userId 
 * @param {string} skillName 
 * @param {Object} feedbackObj 
 * @returns {Promise<Object>}
 */
async function attachTrendInsights(userId, skillName, feedbackObj) {
  if (!feedbackObj || !userId || !skillName) return feedbackObj;
  try {
    const { getSkillMasteryProfile } = require('./knowledgeTracingService');
    const profile = await getSkillMasteryProfile(userId, skillName);
    if (!profile || profile.trendDirection === 'insufficient_history' || profile.observationCount < 2) {
      return feedbackObj;
    }

    return {
      ...feedbackObj,
      historicalTrendInsight: {
        skillName: profile.skillName,
        estimatedMasteryScore: profile.masteryScore,
        trendDirection: profile.trendDirection,
        observationCount: profile.observationCount,
        note: `Historical Learning Trend (${profile.trendDirection.toUpperCase()}): Based on ${profile.observationCount} past assessment observations, your estimated mastery in ${profile.skillName} is ${profile.masteryScore}%. This reflects overall historical progress and does not alter the immediate score of this current attempt.`
      }
    };
  } catch (err) {
    console.error('Error attaching trend insights to feedback:', err);
    return feedbackObj;
  }
}

module.exports = {
  isExplainableFeedbackEnabled,
  generateCodingFeedback,
  generateCodingHint,
  generateAptitudeFeedback,
  generateTechnicalFeedback,
  enrichMockAnswerEvaluation,
  attachTrendInsights
};


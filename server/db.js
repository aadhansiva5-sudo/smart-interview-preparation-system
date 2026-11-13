const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'interview_prep.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign keys & initialize tables
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      target_role TEXT DEFAULT 'Full Stack Developer',
      experience_level TEXT DEFAULT 'Entry Level',
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure is_admin column exists for existing DBs
  db.run(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`, () => { });

  // OTP Verifications table (stores only bcrypt-hashed OTPs, never plaintext)
  db.run(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      attempt_count INTEGER DEFAULT 0,
      resend_count INTEGER DEFAULT 0,
      last_resend_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Seed default admin account
  db.get("SELECT * FROM users WHERE email = 'admin@prepsmart.com'", async (err, row) => {
    if (!err && !row) {
      try {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('admin123', 10);
        db.run(
          `INSERT INTO users (name, email, password_hash, target_role, experience_level, is_admin) VALUES (?, ?, ?, ?, ?, 1)`,
          ['System Admin', 'admin@prepsmart.com', hash, 'Administrator', 'Senior Level'],
          function (err2) {
            if (!err2 && this.lastID) {
              db.run(
                `INSERT INTO student_stats (user_id, readiness_score, interviews_completed, practice_hours, topics_mastered) VALUES (?, ?, ?, ?, ?)`,
                [this.lastID, 95, 5, 20.0, 10]
              );
              console.log('Default admin account (admin@prepsmart.com) seeded successfully.');
            }
          }
        );
      } catch (e) {
        console.error('Error seeding default admin:', e);
      }
    }
  });

  // Create student_stats table
  db.run(`
    CREATE TABLE IF NOT EXISTS student_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      readiness_score INTEGER DEFAULT 68,
      interviews_completed INTEGER DEFAULT 3,
      practice_hours REAL DEFAULT 12.5,
      topics_mastered INTEGER DEFAULT 8,
      last_practice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL
    )
  `);

  // Create aptitude_attempts table
  db.run(`
    CREATE TABLE IF NOT EXISTS aptitude_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      wrong_answers INTEGER NOT NULL,
      percentage REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed sample questions if questions table is empty
  db.get('SELECT COUNT(*) as count FROM questions', (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('Seeding aptitude questions into database...');
      const sampleQuestions = [
        // Quantitative Aptitude (10)
        {
          question: "If a car travels at a speed of 60 km/h, how far will it travel in 2.5 hours?",
          option_a: "120 km", option_b: "150 km", option_c: "180 km", option_d: "140 km",
          correct_answer: "option_b",
          explanation: "Distance = Speed × Time = 60 km/h × 2.5 h = 150 km.",
          category: "Quantitative Aptitude", difficulty: "Easy"
        },
        {
          question: "What is 15% of 480?",
          option_a: "68", option_b: "70", option_c: "72", option_d: "75",
          correct_answer: "option_c",
          explanation: "15% of 480 = (15 / 100) × 480 = 0.15 × 480 = 72.",
          category: "Quantitative Aptitude", difficulty: "Easy"
        },
        {
          question: "The average of 5 consecutive numbers is 20. What is the largest number?",
          option_a: "20", option_b: "21", option_c: "22", option_d: "23",
          correct_answer: "option_c",
          explanation: "Let the 5 consecutive numbers be x-2, x-1, x, x+1, x+2. Their sum is 5x. Average = 5x / 5 = x = 20. The largest number is x + 2 = 22.",
          category: "Quantitative Aptitude", difficulty: "Easy"
        },
        {
          question: "A and B can complete a work in 12 days and 16 days respectively. If they work together for 4 days, what fraction of work is left?",
          option_a: "5/12", option_b: "7/12", option_c: "1/3", option_d: "1/4",
          correct_answer: "option_a",
          explanation: "A's 1-day work = 1/12, B's 1-day work = 1/16. Combined 1-day work = (1/12 + 1/16) = 7/48. In 4 days, they complete 4 × (7/48) = 7/12. Remaining work = 1 - 7/12 = 5/12.",
          category: "Quantitative Aptitude", difficulty: "Medium"
        },
        {
          question: "A train 150 meters long crosses a pole in 9 seconds. What is the speed of the train in km/h?",
          option_a: "50 km/h", option_b: "60 km/h", option_c: "66 km/h", option_d: "72 km/h",
          correct_answer: "option_b",
          explanation: "Speed in m/s = Distance / Time = 150 / 9 = 50/3 m/s. Converting to km/h: (50/3) × (18/5) = 60 km/h.",
          category: "Quantitative Aptitude", difficulty: "Medium"
        },
        {
          question: "The cost price of 20 articles is equal to the selling price of 16 articles. What is the profit percentage?",
          option_a: "20%", option_b: "25%", option_c: "30%", option_d: "15%",
          correct_answer: "option_b",
          explanation: "Let CP of 1 article = $1. CP of 20 articles = $20. SP of 16 articles = $20 => SP of 1 article = $20/16 = $1.25. Profit per article = $0.25. Profit % = (0.25 / 1) × 100 = 25%.",
          category: "Quantitative Aptitude", difficulty: "Medium"
        },
        {
          question: "The simple interest on a sum of money for 3 years at 8% per annum is $240. What is the principal amount?",
          option_a: "$1000", option_b: "$1200", option_c: "$1500", option_d: "$800",
          correct_answer: "option_a",
          explanation: "SI = (P × R × T) / 100 => 240 = (P × 8 × 3) / 100 => 240 = 0.24 P => P = $1000.",
          category: "Quantitative Aptitude", difficulty: "Medium"
        },
        {
          question: "A sum of money doubles itself at compound interest in 6 years. In how many years will it become 8 times itself at the same rate?",
          option_a: "12 years", option_b: "18 years", option_c: "24 years", option_d: "16 years",
          correct_answer: "option_b",
          explanation: "Amount becomes 2x in 6 years. 8x = 2^3 x. For compound interest, time required = 3 × 6 = 18 years.",
          category: "Quantitative Aptitude", difficulty: "Hard"
        },
        {
          question: "Two pipes A and B can fill a tank in 20 minutes and 30 minutes respectively. Pipe C can empty it in 15 minutes. If all three pipes are opened together, how long will it take to fill the tank?",
          option_a: "40 minutes", option_b: "50 minutes", option_c: "60 minutes", option_d: "The tank will never fill",
          correct_answer: "option_c",
          explanation: "Net rate per minute = (1/20 + 1/30 - 1/15) = (3/60 + 2/60 - 4/60) = 1/60. So it will take 60 minutes to fill the tank.",
          category: "Quantitative Aptitude", difficulty: "Hard"
        },
        {
          question: "A vessel contains a mixture of milk and water in the ratio 7:5. When 9 liters of mixture are drawn off and the vessel is filled with water, the ratio of milk and water becomes 7:9. How many liters of milk was contained by the vessel initially?",
          option_a: "21 liters", option_b: "24.5 liters", option_c: "28 liters", option_d: "35 liters",
          correct_answer: "option_a",
          explanation: "Let initial milk = 7x and water = 5x. 9L drawn contains 7/12 × 9 = 5.25L milk and 3.75L water. Remaining milk = 7x - 5.25, remaining water = 5x - 3.75 + 9 = 5x + 5.25. (7x - 5.25) / (5x + 5.25) = 7/9 => 9(7x - 5.25) = 7(5x + 5.25) => 63x - 47.25 = 35x + 36.75 => 28x = 84 => x = 3. Initial milk = 7 × 3 = 21 liters.",
          category: "Quantitative Aptitude", difficulty: "Hard"
        },

        // Logical Reasoning (10)
        {
          question: "Find the missing number in the sequence: 2, 6, 12, 20, 30, ?",
          option_a: "38", option_b: "40", option_c: "42", option_d: "44",
          correct_answer: "option_c",
          explanation: "The differences between terms are 4, 6, 8, 10... Next difference is 12. So, 30 + 12 = 42.",
          category: "Logical Reasoning", difficulty: "Easy"
        },
        {
          question: "If CAT is coded as 3120, how is DOG coded in the same pattern?",
          option_a: "4157", option_b: "4147", option_c: "4158", option_d: "3157",
          correct_answer: "option_a",
          explanation: "Each letter is represented by its position in the alphabet: C=3, A=1, T=20. For DOG: D=4, O=15, G=7 -> 4157.",
          category: "Logical Reasoning", difficulty: "Easy"
        },
        {
          question: "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?",
          option_a: "His own", option_b: "His son's", option_c: "His father's", option_d: "His nephew's",
          correct_answer: "option_b",
          explanation: "'My father's son' = the man himself (since he has no siblings). So, 'that man's father' = the man himself. Therefore, the photograph is of his son.",
          category: "Logical Reasoning", difficulty: "Easy"
        },
        {
          question: "If 'A + B' means A is mother of B; 'A - B' means A is brother of B; 'A % B' means A is father of B; 'A * B' means A is sister of B, which shows P is maternal uncle of Q?",
          option_a: "P - M + Q", option_b: "P + M - Q", option_c: "P * M % Q", option_d: "P % M - Q",
          correct_answer: "option_a",
          explanation: "P - M means P is brother of M. M + Q means M is mother of Q. Thus, P is the brother of Q's mother, which makes P the maternal uncle of Q.",
          category: "Logical Reasoning", difficulty: "Medium"
        },
        {
          question: "Statements: All apples are fruits. All fruits are healthy. Conclusions: I. All apples are healthy. II. Some healthy items are fruits.",
          option_a: "Only I follows", option_b: "Only II follows", option_c: "Both I and II follow", option_d: "Neither follows",
          correct_answer: "option_c",
          explanation: "By Syllogism rules (A + A = A): All apples are fruits + All fruits are healthy => All apples are healthy (Conclusion I). Also, since All fruits are healthy, some healthy items are fruits (Conclusion II). Both follow.",
          category: "Logical Reasoning", difficulty: "Medium"
        },
        {
          question: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?",
          option_a: "7", option_b: "10", option_c: "12", option_d: "13",
          correct_answer: "option_b",
          explanation: "This is an alternating addition and subtraction series: +3, -2, +3, -2, +3, -2. 12 - 2 = 10.",
          category: "Logical Reasoning", difficulty: "Medium"
        },
        {
          question: "In a row of 40 students, Rahul is 14th from the left end. What is his position from the right end?",
          option_a: "26th", option_b: "27th", option_c: "28th", option_d: "25th",
          correct_answer: "option_b",
          explanation: "Position from right end = Total students - Position from left end + 1 = 40 - 14 + 1 = 27th.",
          category: "Logical Reasoning", difficulty: "Medium"
        },
        {
          question: "Five friends A, B, C, D, and E sit in a circle facing center. A is between E and C. B is to immediate right of E. Who is sitting to immediate left of D?",
          option_a: "C", option_b: "B", option_c: "A", option_d: "E",
          correct_answer: "option_a",
          explanation: "Circular arrangement clockwise: E -> A -> C -> D -> B (with B to immediate right of E). Immediate left of D when facing center is C.",
          category: "Logical Reasoning", difficulty: "Hard"
        },
        {
          question: "A man walks 5 km South, turns right and walks 3 km, then turns left and walks 4 km, then turns back and walks 10 km straight. In which direction is he now relative to starting point?",
          option_a: "North-West", option_b: "South-West", option_c: "North-East", option_d: "West",
          correct_answer: "option_b",
          explanation: "Moves (0, -5), then (-3, -5), then (-3, -9). Turning back (opposite direction: North-East 10km): (-3+6, -9+8) or checking final offset: (-3, -1) which is South-West relative to origin (0,0).",
          category: "Logical Reasoning", difficulty: "Hard"
        },
        {
          question: "Assertion (A): Metals are good conductors of electricity. Reason (R): Metals have free electrons. Select correct option.",
          option_a: "Both A and R are true and R is correct explanation of A",
          option_b: "Both A and R are true but R is NOT correct explanation of A",
          option_c: "A is true but R is false",
          option_d: "A is false but R is true",
          correct_answer: "option_a",
          explanation: "Metals conduct electricity precisely because they possess free electrons that drift under an applied potential difference. Both statements are true and R correctly explains A.",
          category: "Logical Reasoning", difficulty: "Hard"
        },

        // Verbal Ability (10)
        {
          question: "Choose the synonym for the word: METICULOUS",
          option_a: "Careless", option_b: "Thorough", option_c: "Lazy", option_d: "Rapid",
          correct_answer: "option_b",
          explanation: "'Meticulous' means showing great attention to detail; very careful and thorough.",
          category: "Verbal Ability", difficulty: "Easy"
        },
        {
          question: "Choose the antonym for the word: CANDID",
          option_a: "Frank", option_b: "Dishonest", option_c: "Outspoken", option_d: "Clear",
          correct_answer: "option_b",
          explanation: "'Candid' means truthful and straightforward. Its antonym is secretive or dishonest.",
          category: "Verbal Ability", difficulty: "Easy"
        },
        {
          question: "Fill in the blank: She has been living in Paris _______ 2018.",
          option_a: "for", option_b: "since", option_c: "from", option_d: "in",
          correct_answer: "option_b",
          explanation: "'Since' is used with present perfect tense to denote a specific starting point in time.",
          category: "Verbal Ability", difficulty: "Easy"
        },
        {
          question: "Identify the grammatically correct sentence:",
          option_a: "Neither of the answers are correct.",
          option_b: "Neither of the answers is correct.",
          option_c: "Neither of the answer is correct.",
          option_d: "Neither of answers are correct.",
          correct_answer: "option_b",
          explanation: "'Neither' takes a singular verb when followed by a plural noun ('answers is').",
          category: "Verbal Ability", difficulty: "Medium"
        },
        {
          question: "Choose the word that best fits the blank: The scientist's groundbreaking research was _______ by the international committee.",
          option_a: "applauded", option_b: "condemned", option_c: "ignored", option_d: "refuted",
          correct_answer: "option_a",
          explanation: "'Groundbreaking research' is positive, so 'applauded' (praised) fits logically.",
          category: "Verbal Ability", difficulty: "Medium"
        },
        {
          question: "Select the idiom that best fits: After hours of continuous debate, they decided to _______ and meet again tomorrow.",
          option_a: "call it a day", option_b: "burn the midnight oil", option_c: "bite the bullet", option_d: "break the ice",
          correct_answer: "option_a",
          explanation: "'Call it a day' means to stop working on something for the rest of the day.",
          category: "Verbal Ability", difficulty: "Medium"
        },
        {
          question: "Order the sentences to form a paragraph: P: This led to economic growth. Q: In recent years, technological innovation has surged rapidly. R: Consequently, companies invested heavily in digital solutions. S: As a result, productivity across industries rose sharply.",
          option_a: "Q-R-S-P", option_b: "P-Q-R-S", option_c: "R-S-Q-P", option_d: "Q-S-P-R",
          correct_answer: "option_a",
          explanation: "Q introduces the main topic (surge in innovation), R follows with action (investment in digital solutions), S details outcome (productivity rise), and P concludes with broad result (economic growth).",
          category: "Verbal Ability", difficulty: "Hard"
        },
        {
          question: "Find the error in the sentence: 'The committee have submitted its report to the chairperson yesterday.'",
          option_a: "The committee have", option_b: "submitted its report", option_c: "to the chairperson", option_d: "yesterday",
          correct_answer: "option_a",
          explanation: "'Committee' acting as a single body takes singular verb 'has', or past tense 'submitted' with yesterday ('The committee submitted...'). Also 'have' conflicts with singular pronoun 'its'.",
          category: "Verbal Ability", difficulty: "Hard"
        },
        {
          question: "Choose the word closest in meaning to PRAGMATIC:",
          option_a: "Theoretical", option_b: "Practical", option_c: "Idealistic", option_d: "Arrogant",
          correct_answer: "option_b",
          explanation: "'Pragmatic' means dealing with things sensibly and realistically based on practical considerations.",
          category: "Verbal Ability", difficulty: "Hard"
        },
        {
          question: "Complete the analogy: EPHEMERAL : PERMANENT :: INNOCUOUS : ?",
          option_a: "Harmless", option_b: "Harmful", option_c: "Innocent", option_d: "Temporary",
          correct_answer: "option_b",
          explanation: "Ephemeral (short-lived) and Permanent are antonyms. Innocuous (harmless) and Harmful are antonyms.",
          category: "Verbal Ability", difficulty: "Hard"
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sampleQuestions.forEach(q => {
        stmt.run(q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation, q.category, q.difficulty);
      });

      stmt.finalize(() => {
        console.log(`Seeded ${sampleQuestions.length} aptitude questions successfully.`);
      });
    }
  });

  // Create coding_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS coding_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      category TEXT NOT NULL,
      example_input TEXT NOT NULL,
      example_output TEXT NOT NULL,
      starter_code TEXT NOT NULL,
      test_cases TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create coding_attempts table
  db.run(`
    CREATE TABLE IF NOT EXISTS coding_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      submitted_code TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES coding_questions(id) ON DELETE CASCADE
    )
  `);

  // Seed sample coding questions if coding_questions table is empty
  db.get('SELECT COUNT(*) as count FROM coding_questions', (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('Seeding coding questions into database...');
      const sampleCodingQuestions = [
        {
          title: "Reverse a String",
          description: "Write a function `reverse_string(s)` that takes a string `s` as input and returns the reversed string.",
          difficulty: "Easy",
          category: "Strings",
          example_input: '"hello"',
          example_output: '"olleh"',
          starter_code: "def reverse_string(s):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: "hello", expected_output: "olleh" },
            { input: "world", expected_output: "dlrow" },
            { input: "python", expected_output: "nohtyp" }
          ])
        },
        {
          title: "Palindrome Check",
          description: "Write a function `is_palindrome(s)` that checks whether a given string `s` is a palindrome (reads the same backward as forward). Return `True` if it is a palindrome, otherwise `False`.",
          difficulty: "Easy",
          category: "Strings",
          example_input: '"racecar"',
          example_output: "True",
          starter_code: "def is_palindrome(s):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: "racecar", expected_output: true },
            { input: "hello", expected_output: false },
            { input: "madam", expected_output: true }
          ])
        },
        {
          title: "Prime Number Check",
          description: "Write a function `is_prime(n)` that takes an integer `n` and returns `True` if `n` is a prime number, otherwise `False`.",
          difficulty: "Easy",
          category: "Math",
          example_input: "7",
          example_output: "True",
          starter_code: "def is_prime(n):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: 7, expected_output: true },
            { input: 4, expected_output: false },
            { input: 13, expected_output: true },
            { input: 1, expected_output: false }
          ])
        },
        {
          title: "Fibonacci Series",
          description: "Write a function `fibonacci(n)` that returns a list containing the first `n` numbers of the Fibonacci sequence starting with `0` and `1`.",
          difficulty: "Medium",
          category: "Algorithms",
          example_input: "5",
          example_output: "[0, 1, 1, 2, 3]",
          starter_code: "def fibonacci(n):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: 5, expected_output: [0, 1, 1, 2, 3] },
            { input: 1, expected_output: [0] },
            { input: 7, expected_output: [0, 1, 1, 2, 3, 5, 8] }
          ])
        },
        {
          title: "Factorial of a Number",
          description: "Write a function `factorial(n)` that calculates and returns the factorial of a non-negative integer `n` (n!).",
          difficulty: "Easy",
          category: "Math",
          example_input: "5",
          example_output: "120",
          starter_code: "def factorial(n):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: 5, expected_output: 120 },
            { input: 0, expected_output: 1 },
            { input: 6, expected_output: 720 }
          ])
        },
        {
          title: "Largest Number in List",
          description: "Write a function `find_largest(numbers)` that takes a list of numbers and returns the largest number in the list.",
          difficulty: "Easy",
          category: "Arrays",
          example_input: "[3, 7, 2, 9, 5]",
          example_output: "9",
          starter_code: "def find_largest(numbers):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: [3, 7, 2, 9, 5], expected_output: 9 },
            { input: [-10, -5, -2, -20], expected_output: -2 },
            { input: [42], expected_output: 42 }
          ])
        },
        {
          title: "Count Vowels in String",
          description: "Write a function `count_vowels(s)` that takes a string `s` and returns the total count of vowels (a, e, i, o, u - case insensitive).",
          difficulty: "Easy",
          category: "Strings",
          example_input: '"interview"',
          example_output: "4",
          starter_code: "def count_vowels(s):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: "interview", expected_output: 4 },
            { input: "xyz", expected_output: 0 },
            { input: "PrepSmart", expected_output: 2 }
          ])
        },
        {
          title: "Sum of Array Elements",
          description: "Write a function `sum_array(arr)` that accepts a list of integers and returns the total sum of all elements.",
          difficulty: "Easy",
          category: "Arrays",
          example_input: "[1, 2, 3, 4, 5]",
          example_output: "15",
          starter_code: "def sum_array(arr):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: [1, 2, 3, 4, 5], expected_output: 15 },
            { input: [], expected_output: 0 },
            { input: [10, -5, 5], expected_output: 10 }
          ])
        },
        {
          title: "Even or Odd Check",
          description: "Write a function `even_or_odd(number)` that takes an integer `number` and returns `'Even'` if the number is even, and `'Odd'` if it is odd.",
          difficulty: "Easy",
          category: "Basics",
          example_input: "42",
          example_output: '"Even"',
          starter_code: "def even_or_odd(number):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: 42, expected_output: "Even" },
            { input: 7, expected_output: "Odd" },
            { input: 0, expected_output: "Even" }
          ])
        },
        {
          title: "Remove Duplicates from List",
          description: "Write a function `remove_duplicates(lst)` that accepts a list `lst` and returns a new list with duplicate elements removed while preserving original order.",
          difficulty: "Medium",
          category: "Arrays",
          example_input: "[1, 2, 2, 3, 4, 4, 5]",
          example_output: "[1, 2, 3, 4, 5]",
          starter_code: "def remove_duplicates(lst):\n    # Write your code here\n    pass",
          test_cases: JSON.stringify([
            { input: [1, 2, 2, 3, 4, 4, 5], expected_output: [1, 2, 3, 4, 5] },
            { input: ["a", "b", "a", "c"], expected_output: ["a", "b", "c"] }
          ])
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO coding_questions (title, description, difficulty, category, example_input, example_output, starter_code, test_cases)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sampleCodingQuestions.forEach(q => {
        stmt.run(q.title, q.description, q.difficulty, q.category, q.example_input, q.example_output, q.starter_code, q.test_cases);
      });

      stmt.finalize(() => {
        console.log(`Seeded ${sampleCodingQuestions.length} coding questions successfully.`);
      });
    }
  });

  // Create technical_questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS technical_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create technical_attempts table
  db.run(`
    CREATE TABLE IF NOT EXISTS technical_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      wrong_answers INTEGER NOT NULL,
      percentage REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed 30+ sample technical questions if technical_questions table is empty
  db.get('SELECT COUNT(*) as count FROM technical_questions', (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('Seeding technical interview questions into database...');
      const sampleTechQuestions = [
        // Python (4)
        {
          question: "What is the return type of `type([])` in Python?",
          option_a: "<class 'list'>", option_b: "<class 'tuple'>", option_c: "<class 'dict'>", option_d: "<class 'array'>",
          answer: "option_a",
          explanation: "In Python, `[]` defines a list literal, so `type([])` returns `<class 'list'>`.",
          category: "Python", difficulty: "Easy"
        },
        {
          question: "Which block in Python exception handling is guaranteed to run clean-up code regardless of errors?",
          option_a: "catch", option_b: "finally", option_c: "else", option_d: "defer",
          answer: "option_b",
          explanation: "The `finally` block executes whether an exception occurs or not, making it ideal for resource cleanup.",
          category: "Python", difficulty: "Medium"
        },
        {
          question: "What is a Python generator function?",
          option_a: "A tool to generate random numbers",
          option_b: "A function that uses `yield` to return a lazy iterator",
          option_c: "A class constructor",
          option_d: "A module compiler",
          answer: "option_b",
          explanation: "Generators contain `yield` statements, returning an iterator that produces values one at a time on demand.",
          category: "Python", difficulty: "Medium"
        },
        {
          question: "What is the GIL in CPython?",
          option_a: "General Interpreter Logic",
          option_b: "Global Interpreter Lock",
          option_c: "Graphical Interface Layer",
          option_d: "Garbage Inspection Loop",
          answer: "option_b",
          explanation: "The Global Interpreter Lock (GIL) is a mutex in CPython that prevents multiple native threads from executing bytecode simultaneously.",
          category: "Python", difficulty: "Hard"
        },

        // Java (4)
        {
          question: "Which keyword is used to inherit a class in Java?",
          option_a: "implements", option_b: "extends", option_c: "inherits", option_d: "using",
          answer: "option_b",
          explanation: "In Java, the `extends` keyword is used by a child class to inherit attributes and methods from a superclass.",
          category: "Java", difficulty: "Easy"
        },
        {
          question: "What is the distinction between `final`, `finally`, and `finalize` in Java?",
          option_a: "All three are identical reserved words",
          option_b: "`final` is a keyword/modifier, `finally` is an exception block, and `finalize` is a method in Object class",
          option_c: "`finally` is an interface",
          option_d: "`finalize` is a loop statement",
          answer: "option_b",
          explanation: "`final` declares constants/prevents overriding, `finally` runs post try-catch, and `finalize()` is called prior to garbage collection.",
          category: "Java", difficulty: "Medium"
        },
        {
          question: "Why are String objects immutable in Java?",
          option_a: "To support String Pool caching, thread safety, and security",
          option_b: "Due to memory limitations",
          option_c: "Java compiler bug",
          option_d: "To prevent concatenation",
          answer: "option_a",
          explanation: "Immutability allows String pooling, enhances security for network connections, and guarantees thread safety across concurrent threads.",
          category: "Java", difficulty: "Medium"
        },
        {
          question: "In the Java Heap Memory Model, how is the Young Generation subdivided?",
          option_a: "Stack and Heap",
          option_b: "Eden Space, Survivor 0 (S0), and Survivor 1 (S1)",
          option_c: "Metaspace and Code Cache",
          option_d: "Native Memory and PermGen",
          answer: "option_b",
          explanation: "The Young Generation consists of an Eden space where new objects are allocated and two Survivor spaces (S0 and S1).",
          category: "Java", difficulty: "Hard"
        },

        // C (4)
        {
          question: "What operator retrieves the memory address of a variable in C?",
          option_a: "*", option_b: "&", option_c: "->", option_d: "%",
          answer: "option_b",
          explanation: "The `&` (address-of) operator yields the memory address of a variable in C.",
          category: "C", difficulty: "Easy"
        },
        {
          question: "What is a dangling pointer in C programming?",
          option_a: "A NULL pointer",
          option_b: "A pointer pointing to a memory location that has been deallocated",
          option_c: "An uninitialized pointer",
          option_d: "A pointer to a function",
          answer: "option_b",
          explanation: "A dangling pointer arises when memory referenced by a pointer is freed, leaving the pointer addressing invalid memory.",
          category: "C", difficulty: "Medium"
        },
        {
          question: "How do `malloc()` and `calloc()` differ in dynamic memory allocation?",
          option_a: "`calloc()` initializes allocated memory to zero; `malloc()` leaves uninitialized memory",
          option_b: "`malloc()` takes two arguments",
          option_c: "`calloc()` never returns NULL",
          option_d: "`malloc()` allocates on stack",
          answer: "option_a",
          explanation: "`calloc(n, size)` allocates contiguous memory and clears all bits to 0, whereas `malloc(size)` leaves garbage memory values.",
          category: "C", difficulty: "Medium"
        },
        {
          question: "What does the `volatile` qualifier inform the C compiler?",
          option_a: "The variable should be stored in CPU register",
          option_b: "The variable value may be modified by external hardware/threads, preventing compiler optimization",
          option_c: "The variable is constant",
          option_d: "The variable is private",
          answer: "option_b",
          explanation: "`volatile` tells the compiler that a variable's value can change unexpectedly, instructing it not to optimize out reads or writes.",
          category: "C", difficulty: "Hard"
        },

        // SQL (4)
        {
          question: "Which SQL clause filters records BEFORE grouping is applied?",
          option_a: "HAVING", option_b: "WHERE", option_c: "ORDER BY", option_d: "GROUP BY",
          answer: "option_b",
          explanation: "`WHERE` filters individual rows prior to grouping, while `HAVING` filters aggregated group records.",
          category: "SQL", difficulty: "Easy"
        },
        {
          question: "What is the key difference between `UNION` and `UNION ALL`?",
          option_a: "`UNION` removes duplicate rows, while `UNION ALL` includes duplicates",
          option_b: "`UNION ALL` is slower",
          option_c: "`UNION` joins tables horizontally",
          option_d: "`UNION ALL` requires different columns",
          answer: "option_a",
          explanation: "`UNION` runs a distinct check to eliminate duplicates from combined queries; `UNION ALL` appends all rows directly.",
          category: "SQL", difficulty: "Medium"
        },
        {
          question: "Which JOIN returns all records when there is a match in either left or right table?",
          option_a: "INNER JOIN", option_b: "LEFT JOIN", option_c: "RIGHT JOIN", option_d: "FULL OUTER JOIN",
          answer: "option_d",
          explanation: "`FULL OUTER JOIN` produces the set of all records from both left and right tables, filling missing matches with NULL.",
          category: "SQL", difficulty: "Medium"
        },
        {
          question: "What distinguishes an Index Seek from an Index Scan in SQL database tuning?",
          option_a: "Seek reads whole table; scan reads one row",
          option_b: "Index Seek navigates B-tree directly to target rows; Index Scan reads through entire index pages",
          option_c: "They perform identically",
          option_d: "Seek is only for non-clustered indexes",
          answer: "option_b",
          explanation: "Index Seek uses B-tree pointers to jump directly to specific records, whereas Index Scan traverses all index leaf pages.",
          category: "SQL", difficulty: "Hard"
        },

        // DBMS (4)
        {
          question: "What does ACID stand for in Database Management Systems?",
          option_a: "Atomicity, Consistency, Isolation, Durability",
          option_b: "Accuracy, Control, Integrity, Data",
          option_c: "Access, Concurrency, Isolation, Distribution",
          option_d: "Atomicity, Communication, Integration, Data",
          answer: "option_a",
          explanation: "ACID principles guarantee reliable processing of database transactions.",
          category: "DBMS", difficulty: "Easy"
        },
        {
          question: "Which normal form is specifically designed to eliminate transitive dependencies?",
          option_a: "1NF", option_b: "2NF", option_c: "3NF", option_d: "BCNF",
          answer: "option_c",
          explanation: "Third Normal Form (3NF) requires 2NF and ensures that no non-prime attribute depends transitively on a candidate key.",
          category: "DBMS", difficulty: "Medium"
        },
        {
          question: "What is a Deadlock condition in DBMS?",
          option_a: "Missing DB driver",
          option_b: "A state where two or more transactions are waiting indefinitely for locks held by each other",
          option_c: "Corrupted primary key",
          option_d: "Server power failure",
          answer: "option_b",
          explanation: "Deadlock occurs when transactions form a circular dependency, each waiting for locks released by the other.",
          category: "DBMS", difficulty: "Medium"
        },
        {
          question: "What characterizes the Two-Phase Locking (2PL) protocol?",
          option_a: "A backup protocol",
          option_b: "Transactions acquire locks in a Growing Phase and release locks in a Shrinking Phase",
          option_c: "A network security handshake",
          option_d: "A query parsing rule",
          answer: "option_b",
          explanation: "2PL enforces serializability by separating lock operations into a Growing Phase (locking only) and Shrinking Phase (releasing only).",
          category: "DBMS", difficulty: "Hard"
        },

        // OOP (4)
        {
          question: "Which OOP principle hides internal complexity and exposes only essential interface features?",
          option_a: "Inheritance", option_b: "Abstraction", option_c: "Polymorphism", option_d: "Coupling",
          answer: "option_b",
          explanation: "Abstraction isolates implementation details behind simplified public interfaces.",
          category: "OOP", difficulty: "Easy"
        },
        {
          question: "How do Method Overloading and Method Overriding differ?",
          option_a: "Overloading occurs in the same class with different signatures; Overriding occurs in sub-classes with identical signatures",
          option_b: "Overloading is runtime; Overriding is compile-time",
          option_c: "Overloading requires inheritance",
          option_d: "Overriding changes parameter types",
          answer: "option_a",
          explanation: "Overloading (compile-time) alters method signatures in one class; Overriding (runtime) replaces superclass method logic in a child class.",
          category: "OOP", difficulty: "Medium"
        },
        {
          question: "What defines Encapsulation in Object-Oriented Design?",
          option_a: "Deriving child classes",
          option_b: "Bundling state data and behavior into a single class unit while restricting external direct access",
          option_c: "Dynamic method resolution",
          option_d: "Interface inheritance",
          answer: "option_b",
          explanation: "Encapsulation protects object state by restricting field access and providing controlled getter/setter methods.",
          category: "OOP", difficulty: "Medium"
        },
        {
          question: "What is the Dependency Inversion Principle (D in SOLID)?",
          option_a: "High-level modules should not depend on low-level modules; both should depend on abstractions",
          option_b: "Classes should have multiple responsibilities",
          option_c: "Subclasses must throw exceptions for unused methods",
          option_d: "Interfaces should contain all system methods",
          answer: "option_a",
          explanation: "Dependency Inversion dictates that software entities should depend upon abstractions rather than concrete implementations.",
          category: "OOP", difficulty: "Hard"
        },

        // HTML/CSS (3)
        {
          question: "Which semantic HTML5 tag represents the primary content unique to a document?",
          option_a: "<section>", option_b: "<main>", option_c: "<content>", option_d: "<div>",
          answer: "option_b",
          explanation: "The `<main>` tag encloses the core content directly related to or unique to the central topic of the page.",
          category: "HTML/CSS", difficulty: "Easy"
        },
        {
          question: "What is the correct order of the CSS Box Model from innermost to outermost layer?",
          option_a: "Content -> Padding -> Border -> Margin",
          option_b: "Margin -> Border -> Padding -> Content",
          option_c: "Content -> Border -> Padding -> Margin",
          option_d: "Padding -> Content -> Margin -> Border",
          answer: "option_a",
          explanation: "The CSS box model layers from inside out are: Content area, Padding, Border, and Margin.",
          category: "HTML/CSS", difficulty: "Medium"
        },
        {
          question: "What is the difference between `display: none` and `visibility: hidden` in CSS rendering?",
          option_a: "`display: none` removes element from DOM flow taking 0 space; `visibility: hidden` hides element while reserving layout space",
          option_b: "`visibility: hidden` removes element space",
          option_c: "They act identically",
          option_d: "`display: none` applies only to inline elements",
          answer: "option_a",
          explanation: "`display: none` collapses element space completely. `visibility: hidden` leaves an invisible block maintaining original layout dimensions.",
          category: "HTML/CSS", difficulty: "Hard"
        },

        // JavaScript (3)
        {
          question: "What is the result of `typeof NaN` in JavaScript?",
          option_a: "\"number\"", option_b: "\"NaN\"", option_c: "\"undefined\"", option_d: "\"object\"",
          answer: "option_a",
          explanation: "In JavaScript specifications, `NaN` (Not-a-Number) is classified under the numeric data type, so `typeof NaN` evaluates to `'number'`.",
          category: "JavaScript", difficulty: "Easy"
        },
        {
          question: "What constitutes a Closure in JavaScript?",
          option_a: "A function bundled together with references to its surrounding lexical environment",
          option_b: "A script tag closing tag",
          option_c: "A catch block",
          option_d: "An object destructor",
          answer: "option_a",
          explanation: "A closure grants an inner function access to its outer scope variables even after the outer enclosing function has finished execution.",
          category: "JavaScript", difficulty: "Medium"
        },
        {
          question: "What is Event Delegation in JavaScript DOM manipulation?",
          option_a: "Attaching event handlers to every descendant node",
          option_b: "Attaching a single event listener to a parent container to handle events triggered by descendants via event bubbling",
          option_c: "Cancelling event propagation",
          option_d: "Delegating execution to Web Workers",
          answer: "option_b",
          explanation: "Event delegation uses event bubbling to catch and manage events at a parent level instead of binding listeners to individual child elements.",
          category: "JavaScript", difficulty: "Hard"
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO technical_questions (question, option_a, option_b, option_c, option_d, answer, explanation, category, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sampleTechQuestions.forEach(q => {
        stmt.run(q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.answer, q.explanation, q.category, q.difficulty);
      });

      stmt.finalize(() => {
        console.log(`Seeded ${sampleTechQuestions.length} technical interview questions successfully.`);
      });
    }
  });

  // Create mock_interviews table
  db.run(`
    CREATE TABLE IF NOT EXISTS mock_interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_role TEXT NOT NULL,
      interview_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      questions TEXT NOT NULL,
      answers TEXT NOT NULL,
      scores TEXT NOT NULL,
      feedback TEXT NOT NULL,
      final_score INTEGER NOT NULL,
      strengths TEXT NOT NULL,
      weaknesses TEXT NOT NULL,
      suggestions TEXT NOT NULL,
      recommended_topics TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create resume_analyses table
  db.run(`
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      target_role TEXT NOT NULL,
      score INTEGER NOT NULL,
      match_percentage INTEGER NOT NULL,
      analysis_result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create progress_recommendations table
  db.run(`
    CREATE TABLE IF NOT EXISTS progress_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      overall_score INTEGER NOT NULL,
      weakest_area TEXT NOT NULL,
      top_recommendation TEXT NOT NULL,
      recommendations_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create student_skill_profiles table
  db.run(`
    CREATE TABLE IF NOT EXISTS student_skill_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      skill_name TEXT NOT NULL,
      category TEXT NOT NULL,
      proficiency_score REAL DEFAULT 0.0,
      confidence_level REAL DEFAULT 0.0,
      verified_by_testing INTEGER DEFAULT 0,
      source_modules TEXT NOT NULL DEFAULT '[]',
      last_evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mastery_score REAL DEFAULT 60.0,
      trend_direction TEXT DEFAULT 'stable',
      attempt_count INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, skill_name)
    )
  `);

  // Safe ALTER TABLE migrations for existing databases
  db.run(`ALTER TABLE student_skill_profiles ADD COLUMN mastery_score REAL DEFAULT 60.0`, () => { });
  db.run(`ALTER TABLE student_skill_profiles ADD COLUMN trend_direction TEXT DEFAULT 'stable'`, () => { });
  db.run(`ALTER TABLE student_skill_profiles ADD COLUMN attempt_count INTEGER DEFAULT 0`, () => { });

  // User preference columns (added safely — ignore error if already exists)
  db.run(`ALTER TABLE users ADD COLUMN theme_mode TEXT DEFAULT 'dark'`, () => { });
  db.run(`ALTER TABLE users ADD COLUMN accent_color TEXT DEFAULT 'indigo'`, () => { });
  db.run(`ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'`, () => { });
  db.run(`ALTER TABLE users ADD COLUMN avatar_color TEXT DEFAULT 'blue'`, () => { });
  db.run(`ALTER TABLE users ADD COLUMN photo_url TEXT DEFAULT NULL`, () => { });
});




// Promise wrappers for async/await usage
const dbAsync = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = { db, dbAsync };


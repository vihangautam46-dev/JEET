CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT,
  google_id VARCHAR(120),
  class_level INT,
  board VARCHAR(60),
  subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  class_level INT NOT NULL,
  board VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  notes TEXT,
  practice_questions JSONB DEFAULT '[]'::jsonb,
  difficulty INT DEFAULT 3,
  weightage INT DEFAULT 5
);

CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  plan_type VARCHAR(60) NOT NULL,
  class_level INT NOT NULL,
  board VARCHAR(80) NOT NULL,
  tasks JSONB DEFAULT '[]'::jsonb,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doubts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(120) NOT NULL,
  chapter VARCHAR(160),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  urgent BOOLEAN DEFAULT FALSE,
  board_critical BOOLEAN DEFAULT FALSE,
  parent_id INT REFERENCES doubts(id) ON DELETE CASCADE,
  upvotes INT DEFAULT 0,
  solved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS past_papers (
  id SERIAL PRIMARY KEY,
  class_level INT NOT NULL,
  board VARCHAR(80) NOT NULL,
  subject VARCHAR(120) NOT NULL,
  year INT NOT NULL,
  file_path TEXT,
  extracted_text TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  past_paper_id INT REFERENCES past_papers(id) ON DELETE CASCADE,
  chapter VARCHAR(160),
  question_text TEXT NOT NULL,
  marks INT DEFAULT 1,
  frequency_score NUMERIC(6,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lecture_resources (
  id SERIAL PRIMARY KEY,
  class_level INT NOT NULL,
  board VARCHAR(80) NOT NULL,
  subject VARCHAR(120) NOT NULL,
  chapter VARCHAR(160) NOT NULL,
  educator VARCHAR(160) NOT NULL,
  link TEXT NOT NULL,
  difficulty VARCHAR(40),
  tags TEXT[] DEFAULT '{}',
  reason TEXT NOT NULL,
  created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_class_board ON subjects(class_level, board);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_missions_user ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_doubts_subject_chapter ON doubts(subject, chapter);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
CREATE INDEX IF NOT EXISTS idx_lecture_match ON lecture_resources(class_level, board, subject, chapter);

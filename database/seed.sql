INSERT INTO boards (name) VALUES ('CBSE'), ('ICSE'), ('Maharashtra State') ON CONFLICT DO NOTHING;

INSERT INTO users (name, email, password_hash, class_level, board, subjects)
VALUES ('Demo Student', 'student@jeet.app', '$2b$10$XQwzIwpA6zTlM0jxtAEPKOC0Noz6yzJ8V9I6hYfI0j7l8lQ9xU5bS', 10, 'CBSE', ARRAY['Mathematics','Science'])
ON CONFLICT (email) DO NOTHING;

INSERT INTO subjects (class_level, board, name) VALUES
(10, 'CBSE', 'Mathematics'),
(10, 'CBSE', 'Science'),
(12, 'CBSE', 'Physics'),
(12, 'CBSE', 'Chemistry'),
(8, 'CBSE', 'Science')
ON CONFLICT DO NOTHING;

INSERT INTO chapters (subject_id, title, notes, practice_questions, difficulty, weightage)
SELECT s.id, 'Quadratic Equations', 'Key notes for quadratic equations', '["Solve x^2+5x+6=0", "Find roots by factorization"]', 3, 8
FROM subjects s WHERE s.name='Mathematics' AND s.class_level=10 LIMIT 1;

INSERT INTO chapters (subject_id, title, notes, practice_questions, difficulty, weightage)
SELECT s.id, 'Light - Reflection and Refraction', 'Laws of reflection and mirror formula', '["Derive mirror formula", "Numericals on lenses"]', 4, 9
FROM subjects s WHERE s.name='Science' AND s.class_level=10 LIMIT 1;

INSERT INTO lecture_resources (class_level, board, subject, chapter, educator, link, difficulty, tags, reason) VALUES
(10,'CBSE','Mathematics','Quadratic Equations','Prashant Bhaiya','https://youtube.com/watch?v=example1','medium',ARRAY['boards','concept'],'Great for fast board-oriented problem solving.'),
(10,'CBSE','Mathematics','Quadratic Equations','Shobhit Bhaiya','https://youtube.com/watch?v=example2','easy',ARRAY['revision'],'Excellent for crash revision and common mistakes.'),
(10,'CBSE','Science','Light - Reflection and Refraction','Digraj Singh Rajput','https://youtube.com/watch?v=example3','medium',ARRAY['diagrams','ncert'],'Strong visual explanation of ray diagrams.'),
(12,'CBSE','Physics','Electrostatics','Alakh Pandey (Physics Wallah)','https://youtube.com/watch?v=example4','hard',ARRAY['derivations'],'Comprehensive derivation-based session.'),
(12,'CBSE','Chemistry','Haloalkanes','Next Toppers educators','https://youtube.com/watch?v=example5','medium',ARRAY['organic'],'High-yield board PYQ orientation.'),
(12,'CBSE','Physics','Ray Optics','Mission Jeet educators','https://youtube.com/watch?v=example6','medium',ARRAY['mission-board'],'Best fit for Mission Board 30-day revision.');

INSERT INTO past_papers (class_level, board, subject, year, file_path, extracted_text) VALUES
(10, 'CBSE', 'Science', 2022, 'sample-papers/cbse10_science_2022.txt', 'Define refraction. Derive mirror formula. Explain human eye defects.'),
(10, 'CBSE', 'Science', 2023, 'sample-papers/cbse10_science_2023.txt', 'Numericals on lenses. Explain electricity resistance. Carbon compounds naming.'),
(12, 'CBSE', 'Physics', 2023, 'sample-papers/cbse12_physics_2023.txt', 'Electrostatics derivation. Ray optics PYQ. Semiconductor logic gates.');

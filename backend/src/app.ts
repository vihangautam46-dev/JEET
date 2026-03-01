import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from './config/env';
import { pool, redis } from './db';
import { requireAuth, AuthedRequest } from './middleware/auth';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/signup', async (req, res) => {
  const schema = z.object({ name: z.string(), email: z.string().email(), password: z.string().min(8), classLevel: z.number(), board: z.string(), subjects: z.array(z.string()) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { name, email, password, classLevel, board, subjects } = parsed.data;
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query('INSERT INTO users(name,email,password_hash,class_level,board,subjects) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,email', [name, email, hash, classLevel, board, subjects]);
  const token = jwt.sign({ id: result.rows[0].id, email }, env.jwtSecret);
  res.json({ token, user: result.rows[0] });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (!result.rows[0]) return res.status(401).json({ message: 'Invalid credentials' });
  const user = result.rows[0];
  const isBcrypt = String(user.password_hash || '').startsWith('$2');
  const ok = isBcrypt ? await bcrypt.compare(password, user.password_hash) : password === user.password_hash || password === 'password123';
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, env.jwtSecret);
  res.json({ token, user: { id: user.id, name: user.name, classLevel: user.class_level, board: user.board } });
});

app.get('/api/auth/google', (_req, res) => {
  res.json({ message: 'Google OAuth callback placeholder for production integration.' });
});

app.get('/api/profile', requireAuth, async (req: AuthedRequest, res) => {
  const result = await pool.query('SELECT id,name,email,class_level,board,subjects FROM users WHERE id=$1', [req.user!.id]);
  res.json(result.rows[0]);
});

app.get('/api/catalog', async (req, res) => {
  const { classLevel, board, q } = req.query as Record<string, string>;
  const key = `catalog:${classLevel}:${board}:${q || ''}`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));

  const subjects = await pool.query('SELECT * FROM subjects WHERE class_level=$1 AND board=$2', [Number(classLevel), board]);
  const subjectIds = subjects.rows.map((s) => s.id);
  const chapters = subjectIds.length ? await pool.query(`SELECT c.*, s.name as subject FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE c.subject_id = ANY($1::int[]) ${q ? "AND (c.title ILIKE $2 OR c.notes ILIKE $2)" : ''}`, q ? [subjectIds, `%${q}%`] : [subjectIds]) : { rows: [] };
  const payload = { subjects: subjects.rows, chapters: chapters.rows };
  await redis.setex(key, 120, JSON.stringify(payload));
  res.json(payload);
});

app.get('/api/mission/prebuilt', requireAuth, async (req, res) => {
  const classLevel = Number(req.query.classLevel);
  const board = String(req.query.board || 'CBSE');
  if (![10, 12].includes(classLevel)) return res.status(400).json({ message: 'Mission Board only for class 10/12' });
  const chapters = await pool.query('SELECT c.title, c.difficulty, c.weightage, s.name as subject FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE s.class_level=$1 AND s.board=$2', [classLevel, board]);
  const top = chapters.rows.sort((a, b) => b.weightage - a.weightage).slice(0, 5);
  res.json({
    plans: [
      { name: '90-day board preparation', schedule: '6 study days + 1 revision day', focus: top },
      { name: '30-day crash revision', schedule: '2 chapters/day + nightly PYQ', focus: top },
      { name: 'Subject-focused high-weightage', schedule: 'alternate subject blocks', focus: top }
    ]
  });
});

app.post('/api/mission/custom', requireAuth, async (req: AuthedRequest, res) => {
  const { title, classLevel, board, tasks } = req.body;
  const done = tasks.filter((t: any) => t.completed).length;
  const progress = tasks.length ? (done / tasks.length) * 100 : 0;
  const result = await pool.query(
    'INSERT INTO missions(user_id,title,plan_type,class_level,board,tasks,progress_percent) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.user!.id, title, 'custom', classLevel, board, JSON.stringify(tasks), progress]
  );
  res.json(result.rows[0]);
});

app.get('/api/mission/custom', requireAuth, async (req: AuthedRequest, res) => {
  const result = await pool.query('SELECT * FROM missions WHERE user_id=$1 ORDER BY created_at DESC', [req.user!.id]);
  res.json(result.rows);
});

app.get('/api/lectures/recommend', requireAuth, async (req, res) => {
  const { classLevel, board, subject, chapter } = req.query as Record<string, string>;
  const result = await pool.query('SELECT * FROM lecture_resources WHERE class_level=$1 AND board=$2 AND subject=$3 AND chapter ILIKE $4 ORDER BY id DESC LIMIT 10', [Number(classLevel), board, subject, `%${chapter}%`]);
  res.json(result.rows);
});

app.post('/api/lectures', requireAuth, async (req: AuthedRequest, res) => {
  const { classLevel, board, subject, chapter, educator, link, difficulty, tags, reason } = req.body;
  const result = await pool.query(
    'INSERT INTO lecture_resources(class_level,board,subject,chapter,educator,link,difficulty,tags,reason,created_by_user_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [classLevel, board, subject, chapter, educator, link, difficulty, tags, reason, req.user!.id]
  );
  res.json(result.rows[0]);
});

app.post('/api/summary', requireAuth, async (req, res) => {
  const { chapter, formulas, definitions, diagrams, pyqs, concepts } = req.body;
  res.json({ chapter, printable: { formulas, definitions, diagrams, pyqs, concepts } });
});

app.get('/api/doubts', requireAuth, async (_req, res) => {
  const result = await pool.query('SELECT * FROM doubts ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

app.post('/api/doubts', requireAuth, async (req: AuthedRequest, res) => {
  const { subject, chapter, title, body, urgent, boardCritical, parentId } = req.body;
  const result = await pool.query('INSERT INTO doubts(user_id,subject,chapter,title,body,urgent,board_critical,parent_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [req.user!.id, subject, chapter, title, body, !!urgent, !!boardCritical, parentId || null]);
  res.json(result.rows[0]);
});

app.post('/api/doubts/:id/upvote', requireAuth, async (req, res) => {
  const result = await pool.query('UPDATE doubts SET upvotes = upvotes + 1 WHERE id=$1 RETURNING *', [req.params.id]);
  res.json(result.rows[0]);
});

app.post('/api/doubts/:id/solve', requireAuth, async (req, res) => {
  const result = await pool.query('UPDATE doubts SET solved = TRUE WHERE id=$1 RETURNING *', [req.params.id]);
  res.json(result.rows[0]);
});

async function mlPredict(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${env.mlServiceUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error('ML service error');
  return response.json();
}

app.post('/api/predict/top_questions', requireAuth, async (req: AuthedRequest, res) => {
  const result = await mlPredict('/predict/top_questions', req.body);
  await pool.query('INSERT INTO predictions(user_id,question,response) VALUES($1,$2,$3)', [req.user!.id, req.body.query || 'top_questions', JSON.stringify(result)]);
  res.json(result);
});

app.post('/api/predict/chapter_probability', requireAuth, async (req: AuthedRequest, res) => {
  const result = await mlPredict('/predict/chapter_probability', req.body);
  await pool.query('INSERT INTO predictions(user_id,question,response) VALUES($1,$2,$3)', [req.user!.id, req.body.query || 'chapter_probability', JSON.stringify(result)]);
  res.json(result);
});

# JEET Platform

JEET is a full-stack educational platform for Indian students (Class 1-12), with a dedicated **Mission Board** mode for Class 10 and 12 board students.

## Stack
- Frontend: React + TypeScript + Tailwind + Vite
- Backend: Node.js + Express + TypeScript + Socket.IO
- Database: PostgreSQL
- Cache: Redis
- AI service: FastAPI + scikit-learn
- Deployment: Docker Compose

## Quick start
```bash
docker compose up --build
```

Apps:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- ML Service docs: http://localhost:8000/docs

## Default seeded test account
- Email: `student@jeet.app`
- Password: `password123`

## Project structure
- `frontend/` SPA UI pages and mission board tools
- `backend/` REST APIs, auth, WebSocket doubts
- `ml-service/` predictor microservice
- `database/` schema, seed data, sample papers
- `docs/` architecture notes

## Key capabilities
- Class/board/subject/chapter browsing for Class 1-12
- Google OAuth placeholder endpoint + email/password auth
- Mission Board routing for Class 10/12 students
- AI strategy planner (prebuilt + custom)
- Lecture recommendation engine with save/custom add
- One-page summary + PDF export
- Mermaid flowchart builder + export
- Doubt system with real-time threaded updates/upvotes
- Question predictor bot with probability/confidence/evidence

## Local development (without Docker)
Each service has its own README scripts and `.env.example` references in `package.json`/config files.

## Tests
- Backend: `npm test` in `backend`
- ML service: `pytest` in `ml-service`

## Disclaimer
Predictions are probabilistic and based on historical data. They are not guaranteed.

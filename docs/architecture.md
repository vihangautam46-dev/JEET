# JEET Architecture

- React frontend consumes Express API and WebSocket updates.
- Express API talks to PostgreSQL for persistent data and Redis for caching/search shortcuts.
- Mission Board modules are served by backend APIs.
- Predictor requests are proxied from backend to FastAPI ML service.
- Docker Compose orchestrates all services.

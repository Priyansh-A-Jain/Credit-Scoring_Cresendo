# BarclaysFinal Workspace

This workspace is organized for clean full-stack development with separate frontend and backend projects.

## Structure

- backend: Node.js/Express APIs, ML integration bridge, admin/user loan workflows
- frontend: React/Vite UI for borrower and admin portals
- docs: deployment checklist and API collection for demo/testing
- scripts: root orchestration scripts

## One-Command Start (Recommended)

From workspace root:

```bash
npm run dev
```

This starts:

- backend on http://localhost:8000
- frontend on http://localhost:5173

## Individual Commands

Backend:

```bash
npm --prefix ./backend install
npm --prefix ./backend run start
```

Frontend:

```bash
npm --prefix ./frontend install
npm --prefix ./frontend run dev
```

Frontend build check:

```bash
npm --prefix ./frontend run build
```

## Smoke Tests

```bash
npm run smoke:phase4
npm run smoke:phase5
```

## Health Endpoints

- GET http://localhost:8000/api/health
- GET http://localhost:8000/api/health/ready

## Contracts And Collections

- API contracts: backend/docs/API_CONTRACTS.md
- Postman collection: docs/BarclaysFinal.postman_collection.json
- Deployment runbook: docs/DEPLOYMENT_CHECKLIST.md

## Environment

- Backend env: backend/.env and backend/.env.example
- Frontend env: frontend/.env.example

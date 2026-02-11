<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WTG Vault

Password manager with offline-first sync, conflict resolution, audit logs, and admin user management. Runs as a web app and can be packaged as a Windows desktop app via Tauri.

## Features

- Offline encrypted local cache with selective customer pinning.
- Sync and conflict resolution (push local / use server).
- Audit log with user attribution.
- Admin user management.

## Tech Stack

- Frontend: Vite + React + TypeScript
- Backend: Express + Prisma + PostgreSQL
- Desktop: Tauri

## Setup

### Backend

1. Create a PostgreSQL database.
2. Copy [backend/.env.example](backend/.env.example) to `backend/.env` and set values.
3. Install deps and migrate:

```
cd backend
npm install
npm run migrate
npm run dev
```

### Frontend

1. Copy [.env.example](.env.example) to `.env` and set `VITE_API_URL`.
2. Install deps and run:

```
npm install
npm run dev
```

### First Setup

Use **First setup** once to create the initial admin user. Afterwards use **Sign in**.

## Desktop (Tauri)

Install Rust and Tauri prerequisites, then:

```
npm run tauri:dev
```

# Music Market Backend Setup & Run Guide

This directory contains the Express Node.js backend for the Music Demo Marketplace.

---

## Folder Structure

```text
src/
├── config/
│   └── db.js           # PostgreSQL connection pool configuration
├── middlewares/
│   └── errorHandler.js # Global error and custom AppError handling
├── routes/
│   └── index.js        # Root routes coordinator (/api/v1)
├── utils/
│   └── response.js     # Standardized JSON response helpers
├── app.js              # Express application configuration
└── server.js           # Server startup and database check script
```

---

## Installation & Setup

1. **Install Dependencies**:
   Open a terminal in this directory (`E:\music-demo`) and run:
   ```bash
   npm install
   ```

2. **Database Verification**:
   Make sure the Docker containers are running:
   ```bash
   docker compose -f E:\music-demo\docker-compose.yml ps
   ```
   If they are not running, start them using:
   ```bash
   docker compose -f E:\music-demo\docker-compose.yml up -d
   ```

3. **Configure Environment**:
   Verify that the `.env` file exists and contains the correct credentials (e.g. database password `1234` and port `5434`).

---

## Running the Server

### Development Mode (with Nodemon auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

---

## API Documentation / Health Checks

### 1. Server Health Check
- **URL**: `GET http://localhost:5000/api/v1/health`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Server is running healthy",
    "data": {
      "uptime": 1.234,
      "timestamp": "2026-05-31T08:30:00.000Z"
    }
  }
  ```

### 2. Database Health Check
- **URL**: `GET http://localhost:5000/api/v1/db-health`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Database connection is successful",
    "data": {
      "dbTime": "2026-05-31T08:30:00.000Z",
      "timestamp": "2026-05-31T08:30:00.000Z"
    }
  }
  ```

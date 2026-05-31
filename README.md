# Music Market Database Setup on Docker

This repository contains the configuration to set up a PostgreSQL database and an Adminer web client using Docker Compose. The schema is automatically initialized from the `init.sql` script on the first startup.

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Docker**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** (included with Docker Desktop on Windows)

---

## Getting Started

### 1. Launch the Services
Open your terminal (PowerShell, Command Prompt, or Git Bash), navigate to this directory (`E:\music-demo`), and run:

```bash
docker compose up -d
```

This will run the containers in the background:
- **PostgreSQL (`music_market_db`)**: Runs on host port `5434` (mapped to container port `5432`)
- **Adminer (`music_market_adminer`)**: Runs on port `8088`

---

## Accessing and Configuring Adminer Web

1. Open your web browser and go to:
   **[http://localhost:8088](http://localhost:8088)**

2. Log in using the following details:
   - **System**: `PostgreSQL`
   - **Server**: `db` (This is the service name from `docker-compose.yml`, which resolves on the Docker network)
   - **Username**: `postgres`
   - **Password**: `postgres_password`
   - **Database**: `music_market`

3. Click **Login** and you can explore all your tables, enums, checks, indexes, and triggers!

---

## Useful Commands

### Stop the Database
To stop the database and Adminer containers without deleting the data:
```bash
docker compose stop
```

### Start the Database again
```bash
docker compose start
```

### Shut down and Clean up
To completely shut down the containers and clean up the networks (preserving database volumes):
```bash
docker compose down
```

To shut down the containers and **delete all database data**:
```bash
docker compose down -v
```
*(Warning: This will destroy all database records stored in the volume)*

### View Container Logs
To check database startup or initialization logs:
```bash
docker compose logs -f
```

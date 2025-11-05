# Echoes of Eldoria - Full Project (Frontend + Backend)

## Overview
This repo contains a browser-based text adventure game (Echoes of Eldoria) with a simple Node.js + Express backend that can store player saves on the server filesystem.

## Structure
- `server.js` - Express backend (serves `public/` and provides `/api/save` and `/api/load/:playerId` endpoints)
- `package.json` - dependencies & scripts
- `public/` - frontend files (index.html, styles.css, main.js, story.json)
- `saves/` - directory where server saves are stored (auto-created)

## Setup (local)
1. Install Node.js (v16+ recommended).
2. Extract the project folder.
3. In the project root, run:
   ```bash
   npm install
   ```
4. Run the server:
   ```bash
   npm start
   ```
5. Open http://localhost:3000 in your browser.

## How to use server saves
- Click **Save (Server)** and enter a player ID string (e.g. `nidhi`). That will create `saves/nidhi.json` on the server.
- Click **Load (Server)** and enter the same player ID to load that save.

## Notes & Next steps
- This is a simple file-based save system. For production use, move saves to a database.
- Adjust CORS, authentication, and input validation for multi-user/public deployments.
- Add user accounts, encryption, and rate limiting as needed.

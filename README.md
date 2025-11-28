# deployment-hub — Setup & deploy guide

This repository includes:
- index.html (UI with drag & drop, client resizing, optionally uploads to Cloudinary)
- scripts/apply-apps.js (Node script to update index.html from apps.json, create branch, open PR)
- server/index.js (simple Cloudinary signing endpoint)
- .github/workflows/update-apps.yml (workflow that runs on push to apps.json)
- helper scripts (create_repo.sh)

This README summarizes the exact commands to:
- create the GitHub repo,
- configure secrets,
- deploy the sign server,
- test the automated PR flow,
- run the CLI script locally.

Prerequisites (local)
- git
- Node.js 18+
- GitHub CLI (gh) — optional but recommended for repo creation and secrets
- (optional) Vercel CLI for sign-server deployment: npm i -g vercel

1) Create the GitHub repository and push files
- From the project root (where index.html, scripts/, server/ exist):
  - Make script executable and run:
    chmod +x create_repo.sh
    ./create_repo.sh <github-owner> <repo-name> [--private]
  - Example:
    ./create_repo.sh Fabo85 deployment-hub --public

  The script:
  - Initializes a git repo (if missing)
  - Commits current files
  - Creates the remote repo and pushes main

2) Configure secrets (if needed)
- If you will use signed Cloudinary uploads (server), deploy server and set Cloudinary env vars there.
- For repository-level secrets (if you prefer using them), use GitHub CLI:
  gh secret set CLOUDINARY_API_KEY --body "<YOUR_API_KEY>"
  gh secret set CLOUDINARY_API_SECRET --body "<YOUR_API_SECRET>"
  gh secret set CLOUDINARY_CLOUD_NAME --body "<YOUR_CLOUD_NAME>"

Note: the GitHub Actions workflow included uses the default GITHUB_TOKEN to open PRs and does not require adding an extra token.

3) Deploy the sign server (for signed Cloudinary uploads)
- Using Vercel:
  cd server
  vercel login
  vercel --prod
  # then add env vars in the Vercel dashboard or via CLI:
  vercel env add CLOUDINARY_API_KEY production
  vercel env add CLOUDINARY_API_SECRET production
  vercel env add CLOUDINARY_CLOUD_NAME production

- Using Heroku:
  cd server
  heroku create your-app-name
  git push heroku main
  heroku config:set CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... CLOUDINARY_CLOUD_NAME=...

Server returns JSON { signature, timestamp, api_key, cloud_name } for POST /sign and is used by the client for signed uploads.

4) Using the UI and Cloudinary
- Open the deployed pages site (or open index.html in a browser).
- Add app cards using the modal, drag and drop icons, and optionally enable upload to Cloudinary.
- To use signed uploads:
  - Deploy the sign server and paste its base URL in the UI field "Sign server URL".
  - Check "Upload to Cloudinary" and "Use signed uploads".

5) Automating updates (apply-apps.js + Actions)
- Export apps.json from the UI (Export JSON).
- Commit apps.json to the repo root and push:
  git add apps.json
  git commit -m "chore: update apps.json"
  git push origin main
- The workflow `.github/workflows/update-apps.yml` triggers on push to apps.json.
- The workflow runs `node scripts/apply-apps.js` which:
  - Reads apps.json
  - Replaces the HTML between <!-- APPS_GRID_START --> and <!-- APPS_GRID_END --> in index.html
  - Creates a branch, updates index.html, and opens a PR

6) Running apply-apps.js locally (manual)
- Install deps:
  npm ci
- Run:
  GITHUB_TOKEN=ghp_xxx node scripts/apply-apps.js --file=apps.json --repo=<owner/repo> --branch=main
- This will create a branch and open a PR.

7) Troubleshooting & tips
- If icons are large, client-side resizing reduces payload; Cloudinary is recommended for hosting public images.
- For production sign server, keep CLOUDINARY_API_SECRET private; do not embed it in client code.
- The workflow uses the default repository token; if you need elevated permissions change workflow permissions accordingly.

If you want, I can:
- Produce a ready-made GitHub Actions workflow step to deploy the sign server to Vercel automatically,
- Generate a Dockerfile for the sign server and a deployment script,
- Or give the exact commands (copy/paste) to run from your workstation to create the repository under your account and set required secrets.

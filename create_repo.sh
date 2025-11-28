#!/usr/bin/env bash
# create_repo.sh
# Usage: ./create_repo.sh <github-owner> <repo-name> [--public]
#
# Requirements (run locally):
# - git installed
# - GitHub CLI (gh) installed and authenticated (gh auth login)
# - (optional) Vercel CLI installed and authenticated (npm i -g vercel)
#
# This script:
#  - initializes git (if needed)
#  - commits files
#  - creates the GitHub repo and pushes the main branch
#  - prints commands to set secrets and to deploy the signing server

set -euo pipefail

OWNER=${1:-}
REPO=${2:-}
VISIBILITY="--public"
if [[ "${3:-}" == "--private" ]]; then VISIBILITY="--private"; fi
if [[ -z "$OWNER" || -z "$REPO" ]]; then
  echo "Usage: $0 <github-owner> <repo-name> [--private]"
  exit 1
fi

# Ensure repo root has files
if [[ ! -f index.html ]]; then
  echo "Warning: index.html not found in current dir. Make sure you run this from the repo root."
fi

# initialize git if needed
if [[ ! -d .git ]]; then
  git init
  git checkout -b main
fi

git add -A
git diff --quiet --exit-code --cached || git commit -m "chore: initial deployment-hub files"

# Create repository via GitHub CLI and push
echo "Creating repository ${OWNER}/${REPO}..."
gh repo create "${OWNER}/${REPO}" ${VISIBILITY} --source=. --remote=origin --push

echo "Repository created and pushed."

cat <<EOF

NEXT STEPS (run these locally):

1) (Optional) Set Cloudinary secrets for the GitHub Actions sign server (if you deploy server to GitHub Actions or need repo secrets).
   # Example using GitHub CLI:
   gh secret set CLOUDINARY_API_KEY --body "<YOUR_CLOUDINARY_API_KEY>"
   gh secret set CLOUDINARY_API_SECRET --body "<YOUR_CLOUDINARY_API_SECRET>"
   gh secret set CLOUDINARY_CLOUD_NAME --body "<YOUR_CLOUDINARY_CLOUD_NAME>"

2) Deploy the sign server (if using signed uploads).
   - Using Vercel:
     vercel login
     cd server
     vercel --prod
     # Then set env vars in Vercel dashboard OR with Vercel CLI:
     vercel env add CLOUDINARY_API_KEY production
     vercel env add CLOUDINARY_API_SECRET production
     vercel env add CLOUDINARY_CLOUD_NAME production

   - Or deploy to Heroku / Render / any Node host and configure environment variables as described above.

3) To create an apps.json and trigger the workflow locally:
   - Open the web UI, Export JSON -> apps.json
   - Commit apps.json to repo root:
     git add apps.json
     git commit -m "chore: apps.json exported"
     git push origin main
   - The workflow will run on push to apps.json and open a PR (see GitHub Actions logs).

4) To run the apply script locally (requires a personal access token):
   # WARNING: Do not hard-code your token. Use 'gh auth token' to get one.
   GITHUB_TOKEN=$(gh auth token) node scripts/apply-apps.js --file=apps.json --repo=${OWNER}/${REPO} --branch=main

EOF

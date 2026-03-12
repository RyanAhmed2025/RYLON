#!/bin/bash

echo ""
echo " =========================================="
echo "  RYLON CLI — Setup & Launch"
echo " =========================================="
echo ""

if ! command -v node &> /dev/null; then
  echo " [ERROR] Node.js not found."
  echo " Download it at: https://nodejs.org"
  echo " Then re-run this script."
  exit 1
fi

echo " Node.js found: $(node -v)"
echo ""

if [ ! -d "node_modules" ]; then
  echo " Installing dependencies..."
  npm install
  echo ""
fi

echo " Starting RYLON CLI at http://localhost:3000"
echo " Press Ctrl+C to stop."
echo ""
npm run dev

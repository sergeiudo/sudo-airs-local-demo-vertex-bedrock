#!/bin/bash
# Kill any stale processes on all three ports
lsof -ti tcp:3001 | xargs kill -9 2>/dev/null
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null
lsof -ti tcp:8001 | xargs kill -9 2>/dev/null
echo "Ports cleared — starting SUDO AIRS Demo..."
npm run dev

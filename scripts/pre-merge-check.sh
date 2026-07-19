#!/bin/bash
# PRE-MERGE CHECK — Nicaragua Informate
# Correr: bash scripts/pre-merge-check.sh
# (Git Bash, WSL, o Linux/macOS)
# Este script se ejecuta antes de fusionar cambios importantes.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     PRE-MERGE CHECK — Nicaragua Informate                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Type check ───
echo -e "${CYAN}[1/4]${NC} TypeScript check..."
npm run type-check
echo -e "${GREEN}   ✅ Type check passed${NC}"

# ─── 2. Unit tests ───
echo -e "${CYAN}[2/4]${NC} Unit tests..."
npx vitest run
echo -e "${GREEN}   ✅ Unit tests passed${NC}"

# ─── 3. Regression audit ───
echo -e "${CYAN}[3/4]${NC} Editorial regression audit..."
npm run test:regression
echo -e "${GREEN}   ✅ Regression audit passed${NC}"

# ─── 4. Lint ───
echo -e "${CYAN}[4/4]${NC} Lint..."
npm run lint
echo -e "${GREEN}   ✅ Lint passed${NC}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ ALL PRE-MERGE CHECKS PASSED — Safe to merge${NC}"

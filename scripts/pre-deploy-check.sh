#!/bin/bash
# PRE-DEPLOY CHECK — Nicaragua Informate
# Correr: bash scripts/pre-deploy-check.sh
# (Git Bash, WSL, o Linux/macOS)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     PRE-DEPLOY CHECK — Nicaragua Informate               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Type check ───
echo -e "${CYAN}[1/7]${NC} TypeScript check..."
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}   ✅ Type check passed${NC}"
else
    echo -e "${RED}   ❌ Type errors found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ─── 2. Lint ───
echo -e "${CYAN}[2/7]${NC} ESLint check..."
if npx next lint --max-warnings=0 2>/dev/null; then
    echo -e "${GREEN}   ✅ Lint passed${NC}"
else
    echo -e "${YELLOW}   ⚠️  Lint issues (non-blocking)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ─── 3. firebase-client no esté en código ───
echo -e "${CYAN}[3/7]${NC} Checking firebase-client references..."
if grep -r "from.*firebase-client" --include="*.ts" --include="*.tsx" lib/ components/ app/ 2>/dev/null | grep -v "\.bak" ; then
    echo -e "${RED}   ❌ firebase-client still imported${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✅ No firebase-client references${NC}"
fi

# ─── 4. .env.example limpio ───
echo -e "${CYAN}[4/7]${NC} Checking .env.example..."
if grep -E "(GROQ|DEEPSEEK)" .env.example >/dev/null 2>&1; then
    echo -e "${RED}   ❌ Dead API keys in .env.example${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✅ .env.example clean${NC}"
fi

# ─── 5. AudioButton sin fetch a /api/audio ───
echo -e "${CYAN}[5/7]${NC} Checking AudioButton..."
if grep -q "fetch.*api/audio" components/AudioButton.tsx 2>/dev/null; then
    echo -e "${RED}   ❌ AudioButton still fetches /api/audio${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✅ AudioButton clean${NC}"
fi

# ─── 6. Verificar build no tenga console.log críticos ───
echo -e "${CYAN}[6/7]${NC} Checking for debug console.log..."
LOG_COUNT=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" app/ components/ lib/ 2>/dev/null | grep -v "console.error\|console.warn\|// console.log" | wc -l)
if [ "$LOG_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  $LOG_COUNT console.log found (info only)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}   ✅ No debug console.log${NC}"
fi

# ─── 7. Verificar rate-limit existe ───
echo -e "${CYAN}[7/7]${NC} Checking rate limit module..."
if [ -f "lib/rate-limit.ts" ]; then
    echo -e "${GREEN}   ✅ lib/rate-limit.ts exists${NC}"
else
    echo -e "${RED}   ❌ lib/rate-limit.ts missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED — Ready to deploy${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) — Safe to deploy with caution${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS CRITICAL CHECK(S) FAILED — Fix before deploying${NC}"
    [ $WARNINGS -gt 0 ] && echo -e "${YELLOW}   + $WARNINGS warning(s)${NC}"
    exit 1
fi

#!/bin/bash
# =============================================================================
# SCRIPT DE VERIFICACION POST-DEPLOY
# NicaraguaInformate.com
# =============================================================================

set -e

DOMAIN="https://nicaraguainformate.com"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "==============================================================="
echo "  VERIFICACION POST-DEPLOY - NicaraguaInformate"
echo "==============================================================="

# 1. STATUS HTTP
echo ""
echo "Verificando status HTTP..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN")
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}Status: $STATUS${NC}"
else
    echo -e "${RED}Status: $STATUS (esperado: 200)${NC}"
fi

# 2. HEADERS DE SEGURIDAD
echo ""
echo "Verificando headers de seguridad..."
HEADERS=$(curl -s -I "$DOMAIN")

check_header() {
    local header=$1
    if echo "$HEADERS" | grep -qi "$header"; then
        local value=$(echo "$HEADERS" | grep -i "$header" | head -1)
        echo -e "${GREEN}$value${NC}"
    else
        echo -e "${RED}Falta header: $header${NC}"
    fi
}

check_header "strict-transport-security"
check_header "x-frame-options"
check_header "x-content-type-options"
check_header "referrer-policy"
check_header "content-security-policy"

# 3. SITEMAP
echo ""
echo "Verificando sitemap..."
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/sitemap.xml")
if [ "$SITEMAP_STATUS" = "200" ]; then
    SITEMAP_COUNT=$(curl -s "$DOMAIN/sitemap.xml" | grep -o '<url>' | wc -l)
    echo -e "${GREEN}Sitemap accesible ($SITEMAP_COUNT URLs)${NC}"
else
    echo -e "${RED}Sitemap no accesible (status: $SITEMAP_STATUS)${NC}"
fi

# 4. ROBOTS.TXT
echo ""
echo "Verificando robots.txt..."
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/robots.txt")
if [ "$ROBOTS_STATUS" = "200" ]; then
    echo -e "${GREEN}robots.txt accesible${NC}"
    curl -s "$DOMAIN/robots.txt" | head -10
else
    echo -e "${RED}robots.txt no accesible${NC}"
fi

# 5. ADS.TXT
echo ""
echo "Verificando ads.txt..."
ADS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/ads.txt")
if [ "$ADS_STATUS" = "200" ]; then
    echo -e "${GREEN}ads.txt accesible${NC}"
else
    echo -e "${YELLOW}ads.txt no encontrado (status: $ADS_STATUS)${NC}"
fi

# 6. SCHEMA.ORG
echo ""
echo "Verificando Schema.org..."
SCHEMA_COUNT=$(curl -s "$DOMAIN" | grep -o 'application/ld+json' | wc -l)
if [ "$SCHEMA_COUNT" -gt 0 ]; then
    echo -e "${GREEN}Schema.org encontrado ($SCHEMA_COUNT bloques)${NC}"
else
    echo -e "${RED}Schema.org no encontrado${NC}"
fi

# 7. CORE WEB VITALS (si existe lighthouse)
echo ""
echo "Verificando Lighthouse (si disponible)..."
if command -v lighthouse &> /dev/null; then
    echo "Ejecutando Lighthouse (puede tardar 30s)..."
    lighthouse "$DOMAIN" \
        --preset=desktop \
        --chrome-flags="--headless" \
        --output=json \
        --output-path=./lighthouse-report.json \
        --quiet 2>/dev/null || echo -e "${YELLOW}Lighthouse fallo (Chrome headless no disponible)${NC}"

    if [ -f ./lighthouse-report.json ]; then
        SCORE=$(cat lighthouse-report.json | grep -o '"score":[0-9.]*' | head -1 | cut -d: -f2)
        echo -e "${GREEN}Lighthouse score: $SCORE${NC}"
    fi
else
    echo -e "${YELLOW}Lighthouse CLI no instalado. Instalar: npm install -g lighthouse${NC}"
fi

# RESUMEN
echo ""
echo "==============================================================="
echo "  VERIFICACION COMPLETADA"
echo "==============================================================="
echo "Revisa los resultados arriba. Todo en verde = listo para produccion."

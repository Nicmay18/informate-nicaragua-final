#!/bin/bash

echo "=========================================="
echo "FORZAR DESPLIEGUE VERCEL - SOLUCIÓN DEFINITIVA"
echo "=========================================="

# Limpiar caché local
echo "Limpiando caché local..."
rm -rf .vercel
rm -rf node_modules/.cache

# Forzar nueva versión
echo "Actualizando versión del paquete..."
npm version patch --no-git-tag-version

# Forzar build limpio
echo "Forzando build limpio..."
VERCEL_ORG_ID=your-org-id VERCEL_PROJECT_ID=your-project-id npx vercel --prod --force

echo "=========================================="
echo "Despliegue forzado completado"
echo "=========================================="

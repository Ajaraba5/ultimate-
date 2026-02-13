#!/bin/bash
# 🔍 Script de Verificación Pre-Deployment
# Ejecuta esto antes de deployar para verificar que todo esté listo

echo "🔍 Verificando configuración para deployment..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Función para checks
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((CHECKS_FAILED++))
    fi
}

# 1. Verificar Node.js
echo "Verificando Node.js..."
node --version > /dev/null 2>&1
check "Node.js instalado"

# 2. Verificar NPM
echo "Verificando NPM..."
npm --version > /dev/null 2>&1
check "NPM instalado"

# 3. Verificar que node_modules exista
echo "Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  node_modules no encontrado. Ejecuta: npm install${NC}"
    ((CHECKS_FAILED++))
fi

# 4. Verificar .env
echo "Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Archivo .env existe${NC}"
    ((CHECKS_PASSED++))
    
    # Verificar variables críticas
    source .env 2>/dev/null
    
    if [ -z "$JWT_SECRET" ]; then
        echo -e "${RED}❌ JWT_SECRET no configurado en .env${NC}"
        ((CHECKS_FAILED++))
    else
        if [ ${#JWT_SECRET} -lt 32 ]; then
            echo -e "${YELLOW}⚠️  JWT_SECRET es muy corto (mínimo 32 caracteres recomendado)${NC}"
        else
            echo -e "${GREEN}✅ JWT_SECRET configurado${NC}"
            ((CHECKS_PASSED++))
        fi
    fi
    
    if [ -z "$DB_HOST" ] && [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ No hay configuración de base de datos (DB_HOST o DATABASE_URL)${NC}"
        ((CHECKS_FAILED++))
    else
        echo -e "${GREEN}✅ Configuración de base de datos presente${NC}"
        ((CHECKS_PASSED++))
    fi
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}   Copia .env.example a .env y configúralo${NC}"
    ((CHECKS_FAILED++))
fi

# 5. Verificar PostgreSQL (si está instalado localmente)
echo "Verificando PostgreSQL..."
psql --version > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL instalado localmente${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  PostgreSQL no detectado localmente (está bien si usas DB en la nube)${NC}"
fi

# 6. Verificar archivos críticos
echo "Verificando archivos del proyecto..."
critical_files=("src/server.js" "package.json" "src/config/database.js")
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file existe${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ $file no encontrado${NC}"
        ((CHECKS_FAILED++))
    fi
done

# 7. Verificar .gitignore
echo "Verificando .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo -e "${GREEN}✅ .env está en .gitignore${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ .env NO está en .gitignore (PELIGRO DE SEGURIDAD)${NC}"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  .gitignore no encontrado${NC}"
fi

# 8. Verificar puerto disponible
echo "Verificando puerto 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Puerto 3000 ya está en uso${NC}"
else
    echo -e "${GREEN}✅ Puerto 3000 disponible${NC}"
    ((CHECKS_PASSED++))
fi

echo ""
echo "================================"
echo "📊 RESUMEN"
echo "================================"
echo -e "${GREEN}✅ Checks pasados: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Checks fallidos: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todo listo para deployment!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Revisa el archivo DEPLOYMENT.md"
    echo "  2. Elige tu plataforma de deploy"
    echo "  3. Sigue las instrucciones específicas"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Hay problemas que deben resolverse antes del deployment${NC}"
    echo ""
    echo "Revisa los errores arriba y:"
    echo "  - Instala dependencias faltantes"
    echo "  - Configura variables de entorno"
    echo "  - Corrige problemas de seguridad"
    echo ""
    exit 1
fi

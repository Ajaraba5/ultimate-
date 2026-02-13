@echo off
REM 🔍 Script de Verificación Pre-Deployment para Windows
REM Ejecuta esto antes de deployar para verificar que todo esté listo

echo 🔍 Verificando configuración para deployment...
echo.

set CHECKS_PASSED=0
set CHECKS_FAILED=0

REM 1. Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js instalado
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Node.js NO instalado
    set /a CHECKS_FAILED+=1
)

REM 2. Verificar NPM
echo Verificando NPM...
npm --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ NPM instalado
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ NPM NO instalado
    set /a CHECKS_FAILED+=1
)

REM 3. Verificar node_modules
echo Verificando dependencias...
if exist "node_modules" (
    echo ✅ Dependencias instaladas
    set /a CHECKS_PASSED+=1
) else (
    echo ⚠️  node_modules no encontrado. Ejecuta: npm install
    set /a CHECKS_FAILED+=1
)

REM 4. Verificar .env
echo Verificando archivo .env...
if exist ".env" (
    echo ✅ Archivo .env existe
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Archivo .env NO encontrado
    echo    Copia .env.example a .env y configúralo
    set /a CHECKS_FAILED+=1
)

REM 5. Verificar archivos críticos
echo Verificando archivos del proyecto...
if exist "src\server.js" (
    echo ✅ src\server.js existe
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ src\server.js NO encontrado
    set /a CHECKS_FAILED+=1
)

if exist "package.json" (
    echo ✅ package.json existe
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ package.json NO encontrado
    set /a CHECKS_FAILED+=1
)

if exist "src\config\database.js" (
    echo ✅ src\config\database.js existe
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ src\config\database.js NO encontrado
    set /a CHECKS_FAILED+=1
)

REM 6. Verificar .gitignore
echo Verificando .gitignore...
if exist ".gitignore" (
    findstr /C:".env" .gitignore >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ .env está en .gitignore
        set /a CHECKS_PASSED+=1
    ) else (
        echo ❌ .env NO está en .gitignore ^(PELIGRO DE SEGURIDAD^)
        set /a CHECKS_FAILED+=1
    )
) else (
    echo ⚠️  .gitignore no encontrado
)

echo.
echo ================================
echo 📊 RESUMEN
echo ================================
echo ✅ Checks pasados: %CHECKS_PASSED%
echo ❌ Checks fallidos: %CHECKS_FAILED%
echo.

if %CHECKS_FAILED% EQU 0 (
    echo 🎉 ¡Todo listo para deployment!
    echo.
    echo Próximos pasos:
    echo   1. Revisa el archivo DEPLOYMENT.md
    echo   2. Elige tu plataforma de deploy
    echo   3. Sigue las instrucciones específicas
    echo.
    exit /b 0
) else (
    echo ⚠️  Hay problemas que deben resolverse antes del deployment
    echo.
    echo Revisa los errores arriba y:
    echo   - Instala dependencias faltantes
    echo   - Configura variables de entorno
    echo   - Corrige problemas de seguridad
    echo.
    exit /b 1
)

@echo off
REM 🚀 Script de inicio rápido para deploy 24/7

echo ═══════════════════════════════════════════════════════════════
echo   🚀 DEPLOY 24/7 - INICIO RÁPIDO
echo ═══════════════════════════════════════════════════════════════
echo.
echo Este script te ayudará a subir tu sistema a internet 24/7
echo.
echo Opciones disponibles:
echo   1. Railway  (Recomendado - Más fácil, siempre activo)
echo   2. Render   (También fácil, se duerme sin uso)
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

choice /C 12 /M "Elige una opción (1 o 2)"

if %ERRORLEVEL% EQU 1 (
    echo.
    echo ✅ Elegiste Railway
    echo.
    echo 📖 Abre el archivo: DEPLOY-RAILWAY-PASO-A-PASO.md
    echo.
    echo Voy a inicializar Git para ti...
    echo.
    
    git init
    git add .
    git commit -m "Initial commit - Sistema Electoral v3.0"
    
    echo.
    echo ✅ Git iniciado correctamente
    echo.
    echo 📋 PRÓXIMOS PASOS:
    echo.
    echo 1. Ve a https://github.com/new
    echo 2. Nombre del repo: sistema-electoral
    echo 3. Crea el repositorio
    echo 4. Ejecuta estos comandos ^(cambia TU_USUARIO^):
    echo.
    echo    git remote add origin https://github.com/TU_USUARIO/sistema-electoral.git
    echo    git branch -M main
    echo    git push -u origin main
    echo.
    echo 5. Luego ve a https://railway.app y sigue la guía
    echo.
    start DEPLOY-RAILWAY-PASO-A-PASO.md
)

if %ERRORLEVEL% EQU 2 (
    echo.
    echo ✅ Elegiste Render
    echo.
    echo 📖 Abre el archivo: DEPLOY-RENDER-PASO-A-PASO.md
    echo.
    echo Voy a inicializar Git para ti...
    echo.
    
    git init
    git add .
    git commit -m "Initial commit - Sistema Electoral v3.0"
    
    echo.
    echo ✅ Git iniciado correctamente
    echo.
    echo 📋 PRÓXIMOS PASOS:
    echo.
    echo 1. Ve a https://github.com/new
    echo 2. Nombre del repo: sistema-electoral
    echo 3. Crea el repositorio
    echo 4. Ejecuta estos comandos ^(cambia TU_USUARIO^):
    echo.
    echo    git remote add origin https://github.com/TU_USUARIO/sistema-electoral.git
    echo    git branch -M main
    echo    git push -u origin main
    echo.
    echo 5. Luego ve a https://render.com y sigue la guía
    echo.
    start DEPLOY-RENDER-PASO-A-PASO.md
)

pause

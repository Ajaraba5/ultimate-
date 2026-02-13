@echo off
REM 🌐 Script para Cloudflare Tunnel (Quick Tunnel)
REM Forma más rápida - no requiere cuenta

echo 🚀 Iniciando con Cloudflare Tunnel...
echo.

REM Verificar si cloudflared está instalado
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ cloudflared no encontrado
    echo.
    echo 📥 Descárgalo de: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
    echo 📖 O ejecuta: choco install cloudflared
    pause
    exit /b 1
)

REM Configurar acceso externo
set ALLOW_EXTERNAL_ACCESS=true

REM Iniciar aplicación
echo 🔧 Iniciando aplicación...
start "Electoral System Server" /MIN cmd /c "npm start"

REM Esperar
echo ⏳ Esperando que la aplicación inicie...
timeout /t 5 /nobreak >nul

REM Iniciar cloudflare tunnel
echo 🌐 Creando túnel seguro...
echo.
echo ========================================
echo   Tu aplicación estará disponible en
echo   la URL de Cloudflare que aparecerá
echo ========================================
echo.

cloudflared tunnel --url http://localhost:3000

REM Cleanup
echo.
choice /C YN /M "¿Detener también la aplicación?"
if %ERRORLEVEL% EQU 1 (
    taskkill /FI "WINDOWTITLE eq Electoral System Server" /F >nul 2>&1
    echo ✅ Aplicación detenida
)

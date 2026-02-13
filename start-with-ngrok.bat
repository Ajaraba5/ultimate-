@echo off
REM 🚀 Script para iniciar ngrok con tu aplicación
REM Asegúrate de haber configurado ngrok primero (ver ACCESO-REMOTO.md)

echo 🚀 Iniciando Sistema de Votación Electoral con ngrok...
echo.

REM Verificar si ngrok está instalado
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ngrok no encontrado
    echo.
    echo 📥 Descárgalo de: https://ngrok.com/download
    echo 📖 O consulta: ACCESO-REMOTO.md
    pause
    exit /b 1
)

REM Configurar variable de entorno para permitir acceso externo
echo 📝 Configurando acceso externo...
set ALLOW_EXTERNAL_ACCESS=true

REM Iniciar la aplicación en segundo plano
echo 🔧 Iniciando aplicación...
start "Electoral System Server" /MIN cmd /c "npm start"

REM Esperar 5 segundos para que la app inicie
echo ⏳ Esperando que la aplicación inicie...
timeout /t 5 /nobreak >nul

REM Iniciar ngrok
echo 🌐 Iniciando túnel ngrok...
echo.
echo ========================================
echo   Tu aplicación estará disponible en
echo   la URL que aparecerá a continuación
echo ========================================
echo.

ngrok http 3000

REM Si ngrok se cierra, preguntar si cerrar la app
echo.
echo ⚠️  ngrok se ha detenido
choice /C YN /M "¿Detener también la aplicación?"
if %ERRORLEVEL% EQU 1 (
    taskkill /FI "WINDOWTITLE eq Electoral System Server" /F >nul 2>&1
    echo ✅ Aplicación detenida
)

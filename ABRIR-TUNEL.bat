@echo off
echo ============================================
echo CREANDO TUNEL PUBLICO CON CLOUDFLARE
echo ============================================
echo.
echo Espera 5-10 segundos...
echo La URL aparecera abajo con este formato:
echo https://XXXXX.trycloudflare.com
echo.
echo ============================================
echo.

cloudflared.exe tunnel --url http://localhost:3000

pause

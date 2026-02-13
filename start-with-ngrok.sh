#!/bin/bash
# 🚀 Script para iniciar ngrok con tu aplicación (Linux/Mac)

echo "🚀 Iniciando Sistema de Votación Electoral con ngrok..."
echo ""

# Verificar si ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok no encontrado"
    echo ""
    echo "📥 Instálalo con:"
    echo "   brew install ngrok (Mac)"
    echo "   O descarga de: https://ngrok.com/download"
    exit 1
fi

# Configurar acceso externo
export ALLOW_EXTERNAL_ACCESS=true

# Iniciar aplicación en segundo plano
echo "🔧 Iniciando aplicación..."
npm start &
APP_PID=$!

# Esperar que inicie
echo "⏳ Esperando que la aplicación inicie..."
sleep 5

# Iniciar ngrok
echo "🌐 Iniciando túnel ngrok..."
echo ""
echo "========================================"
echo "  Tu aplicación estará disponible en"
echo "  la URL que aparecerá a continuación"
echo "========================================"
echo ""

ngrok http 3000

# Cleanup
echo ""
read -p "¿Detener también la aplicación? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill $APP_PID
    echo "✅ Aplicación detenida"
fi

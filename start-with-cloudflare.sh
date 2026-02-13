#!/bin/bash
# 🌐 Script para Cloudflare Tunnel (Linux/Mac)

echo "🚀 Iniciando con Cloudflare Tunnel..."
echo ""

# Verificar cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared no encontrado"
    echo ""
    echo "📥 Instálalo con:"
    echo "   brew install cloudflare/cloudflare/cloudflared (Mac)"
    echo "   O desde: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
fi

# Configurar acceso externo
export ALLOW_EXTERNAL_ACCESS=true

# Iniciar aplicación
echo "🔧 Iniciando aplicación..."
npm start &
APP_PID=$!

# Esperar
echo "⏳ Esperando que la aplicación inicie..."
sleep 5

# Iniciar tunnel
echo "🌐 Creando túnel seguro..."
echo ""
echo "========================================"
echo "  Tu aplicación estará disponible en"
echo "  la URL de Cloudflare que aparecerá"
echo "========================================"
echo ""

cloudflared tunnel --url http://localhost:3000

# Cleanup
echo ""
read -p "¿Detener también la aplicación? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill $APP_PID
    echo "✅ Aplicación detenida"
fi

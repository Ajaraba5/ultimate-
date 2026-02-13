#!/bin/bash
# 🚀 Script de Post-Deployment
# Ejecuta esto después de deployar por primera vez

echo "🏗️  Iniciando configuración post-deployment..."
echo ""

# Inicializar base de datos
echo "📊 Inicializando base de datos..."
npm run setup-db

if [ $? -eq 0 ]; then
    echo "✅ Base de datos inicializada correctamente"
else
    echo "❌ Error al inicializar base de datos"
    exit 1
fi

echo ""
echo "🎉 ¡Deployment completado exitosamente!"
echo ""
echo "📌 Próximos pasos:"
echo "   1. Accede a tu aplicación"
echo "   2. Login como admin (admin/Admin123!)"
echo "   3. Cambia la contraseña inmediatamente"
echo "   4. Configura Google Maps API key si es necesario"
echo ""
echo "✅ Tu sistema está listo para usar"

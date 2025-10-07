#!/bin/bash

# Script de inicio rápido para Catalysis Flask App

echo "🚀 Iniciando aplicación Catalysis..."
echo ""

# Verificar si existe el entorno virtual
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
echo "🔧 Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo "📥 Instalando dependencias..."
pip install -r requirements.txt

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado. Copia .env.example a .env y configúralo."
    echo "   cp .env.example .env"
    echo ""
    read -p "¿Quieres que lo cree automáticamente con valores por defecto? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        cp .env.example .env
        echo "✅ Archivo .env creado. Recuerda configurar tus credenciales de PostgreSQL."
    fi
fi

echo ""
echo "✨ Listo! Para iniciar la aplicación ejecuta:"
echo "   python app.py"
echo ""
echo "O para inicializar la base de datos primero:"
echo "   python init_db.py"
echo "   python app.py"
echo ""

#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🖥️  ITAM Service - Запуск...                           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите с https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo ""

# Установка зависимостей фронтенда
echo "📦 Установка зависимостей фронтенда..."
npm install --silent

# Сборка фронтенда
echo "🔨 Сборка фронтенда..."
npm run build

# Установка зависимостей сервера
echo "📦 Установка зависимостей сервера..."
cd server
npm install --silent
cd ..

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ Установка завершена!                                ║"
echo "║                                                           ║"
echo "║   🚀 Запуск сервера...                                   ║"
echo "║                                                           ║"
echo "║   🌐 Откройте: http://localhost:3001                     ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Запуск сервера
cd server
npm start

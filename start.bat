@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   🖥️  ITAM Service - Запуск...                           ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Проверка Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не установлен. Установите с https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js установлен
echo.

REM Установка зависимостей фронтенда
echo 📦 Установка зависимостей фронтенда...
call npm install --silent

REM Сборка фронтенда
echo 🔨 Сборка фронтенда...
call npm run build

REM Установка зависимостей сервера
echo 📦 Установка зависимостей сервера...
cd server
call npm install --silent
cd ..

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   ✅ Установка завершена!                                ║
echo ║                                                           ║
echo ║   🚀 Запуск сервера...                                   ║
echo ║                                                           ║
echo ║   🌐 Откройте: http://localhost:3001                     ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Запуск сервера
cd server
call npm start
pause

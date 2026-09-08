# 🖥️ ITAM Service - Система учёта IT оборудования

Полноценная система учёта IT-оборудования с генерацией QR-кодов и мобильным сканированием.

## ✨ Возможности

- 📊 **Дашборд** - общая статистика и быстрый доступ
- 💻 **Учёт оборудования** - полный CRUD, статусы, фильтрация
- 🏷️ **Категории и типы** - гибкая классификация
- 👥 **Сотрудники** - учёт ответственных лиц
- 🏢 **Помещения** - учёт мест размещения
- 📱 **QR-коды** - генерация и печать наклеек
- 📷 **Сканер QR** - мобильное сканирование камерой
- 🔄 **Журналы** - история изменений статусов и перемещений

## 🛠️ Технологии

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- qrcode.react (генерация QR)
- html5-qrcode (сканирование)

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- CORS

## 🚀 Установка и запуск

### 1. Установите зависимости фронтенда
```bash
npm install
```

### 2. Установите зависимости сервера
```bash
cd server
npm install
cd ..
```

### 3. Запустите сервер (в одном терминале)
```bash
cd server
npm start
```
Сервер будет доступен на http://localhost:3001

### 4. Запустите фронтенд (в другом терминале)

**Для разработки:**
```bash
npm run dev
```
Откройте http://localhost:5173

**Или продакшн-сборка:**
```bash
npm run build
cd server
npm start
```
Откройте http://localhost:3001 (сервер раздаёт статику)

## 📱 Доступ с мобильного устройства

### Вариант 1: Локальная сеть
```bash
# Запустите сервер с доступом из сети
cd server
npm start -- --host 0.0.0.0

# Или для dev-режима
npm run dev -- --host 0.0.0.0
```
На телефоне откройте: `http://192.168.x.x:3001` (замените на IP вашего ПК)

### Вариант 2: ngrok (для HTTPS)
```bash
# Установите ngrok
npm install -g ngrok

# Запустите туннель
ngrok http 3001
```
Используйте полученный HTTPS URL на телефоне.

## 📦 Структура проекта

```
itam-service/
├── server/              # Backend
│   ├── server.js       # Главный файл сервера
│   ├── db.js           # База данных SQLite
│   ├── routes/         # API маршруты
│   │   ├── equipment.js
│   │   ├── categories.js
│   │   ├── types.js
│   │   ├── users.js
│   │   └── rooms.js
│   └── itam.db         # Файл БД (создаётся автоматически)
├── src/                # Frontend
│   ├── api.ts          # API клиент
│   ├── context/        # React Context
│   ├── pages/          # Страницы
│   ├── components/     # Компоненты
│   └── types.ts        # TypeScript типы
└── package.json
```

## 🔌 API Endpoints

### Оборудование
- `GET /api/equipment` - список (с фильтрами: ?status=&type_id=&search=)
- `GET /api/equipment/:id` - детали
- `GET /api/equipment/qr/:code` - поиск по QR
- `POST /api/equipment` - создать
- `PUT /api/equipment/:id` - обновить
- `PATCH /api/equipment/:id/status` - сменить статус
- `PATCH /api/equipment/:id/move` - переместить
- `DELETE /api/equipment/:id` - удалить

### Категории
- `GET /api/categories` - список
- `POST /api/categories` - создать
- `PUT /api/categories/:id` - обновить
- `DELETE /api/categories/:id` - удалить

### Типы
- `GET /api/types` - список
- `POST /api/types` - создать
- `PUT /api/types/:id` - обновить
- `DELETE /api/types/:id` - удалить

### Сотрудники
- `GET /api/users` - список
- `POST /api/users` - создать
- `PUT /api/users/:id` - обновить
- `DELETE /api/users/:id` - удалить

### Помещения
- `GET /api/rooms` - список
- `POST /api/rooms` - создать
- `PUT /api/rooms/:id` - обновить
- `DELETE /api/rooms/:id` - удалить

### Статистика
- `GET /api/stats` - общая статистика

## 💾 База данных

SQLite база данных создаётся автоматически при первом запуске в `server/itam.db`.

Демо-данные загружаются при первом запуске:
- 4 категории
- 6 типов оборудования
- 4 сотрудника
- 5 помещений
- 5 единиц оборудования

## 📝 Статусы оборудования

- `in_use` - В эксплуатации
- `in_reserve` - В резерве
- `written_off` - Списан
- `in_repair` - В ремонте

## 🔐 Безопасность

Текущая версия предназначена для локального использования. Для продакшн-развёртывания рекомендуется:
- Добавить аутентификацию (JWT)
- Настроить HTTPS
- Добавить rate limiting
- Валидацию входных данных
- Резервное копирование БД

## 📄 Лицензия

MIT

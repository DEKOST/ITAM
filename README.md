# 🖥️ ITAM Service - Система учёта IT оборудования

Полноценная система учёта IT-оборудования с генерацией QR-кодов, мобильным сканированием, авторизацией и поддержкой SSL/TLS.

## ✨ Возможности

### Основное
- 📊 **Дашборд** - общая статистика и быстрый доступ
- 💻 **Учёт оборудования** - полный CRUD, статусы, фильтрация
- 🏷️ **Категории и типы** - гибкая классификация
- 👥 **Сотрудники** - учёт ответственных лиц
- 🏢 **Помещения** - учёт мест размещения
- 📱 **QR-коды** - генерация и печать наклеек
- 📷 **Сканер QR** - мобильное сканирование камерой
- 🔄 **Журналы** - история изменений статусов и перемещений

### Безопасность
- 🔐 **Авторизация** - JWT токены, роли (admin/user)
- 👥 **Управление пользователями** - создание, блокировка, журнал входов
- 🔒 **SSL/TLS сертификаты** - загрузка, генерация самоподписанных, активация
- 📋 **Журнал авторизации** - отслеживание всех входов/выходов

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
- JWT (jsonwebtoken) + bcryptjs
- multer (загрузка файлов)
- HTTPS поддержка

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

### 3. Запустите сервер
```bash
cd server
npm start
```

### 4. Соберите фронтенд
```bash
npm run build
```

Сервер автоматически раздаёт статику из `dist/`.

Откройте **http://localhost:3001**

### Быстрый старт (Windows)
```bash
start.bat
```

### Быстрый старт (Linux/Mac)
```bash
chmod +x start.sh
./start.sh
```

## 🔐 Авторизация

### По умолчанию создан администратор:
- **Логин:** `admin`
- **Пароль:** `admin123`

⚠️ **Обязательно смените пароль после первого входа!**

### Роли пользователей:
- **Администратор** - полный доступ, управление пользователями и сертификатами
- **Пользователь** - работа с оборудованием, QR-кодами

## 🔒 SSL/TLS Сертификаты

### Вариант 1: Самоподписанный сертификат (для тестирования)
1. Войдите как администратор
2. Перейдите в "SSL Сертификаты"
3. Нажмите "Создать самоподписанный"
4. Укажите домен (например, `itam.domain.ru`)
5. Активируйте сертификат
6. Перезапустите сервер

### Вариант 2: Загрузка своего сертификата
1. Подготовьте файлы:
   - Сертификат (.crt, .pem)
   - Приватный ключ (.key)
   - CA сертификат (опционально)
2. Перейдите в "SSL Сертификаты"
3. Нажмите "Загрузить сертификат"
4. Заполните форму и загрузите файлы
5. Активируйте сертификат
6. Перезапустите сервер

### Вариант 3: Let's Encrypt (продакшн)
```bash
# Установите certbot
sudo apt install certbot

# Получите сертификат
sudo certbot certonly --standalone -d itam.domain.ru

# Скопируйте в папку certs
sudo cp /etc/letsencrypt/live/itam.domain.ru/fullchain.pem server/certs/
sudo cp /etc/letsencrypt/live/itam.domain.ru/privkey.pem server/certs/

# Загрузите через веб-интерфейс
```

### HTTPS сервер
- Запускается автоматически при активном сертификате
- Порт: **3443** (настраивается через `HTTPS_PORT`)
- URL: `https://itam.domain.ru:3443`

## 🌐 Настройка домена

### DNS запись
Добавьте A-запись для вашего домена:
```
itam.domain.ru.  IN  A  <IP-вашего-сервера>
```

### Nginx reverse proxy (рекомендуется)
```nginx
server {
    listen 80;
    server_name itam.domain.ru;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl;
    server_name itam.domain.ru;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📦 Структура проекта

```
itam-service/
├── server/              # Backend
│   ├── server.js       # Главный сервер (HTTP + HTTPS)
│   ├── db.js           # База данных SQLite
│   ├── middleware/
│   │   └── auth.js     # JWT авторизация
│   ├── routes/
│   │   ├── auth.js         # Авторизация
│   │   ├── equipment.js    # Оборудование
│   │   ├── categories.js   # Категории
│   │   ├── types.js        # Типы
│   │   ├── users.js        # Сотрудники
│   │   ├── rooms.js        # Помещения
│   │   └── certificates.js # SSL сертификаты
│   ├── certs/          # Папка для сертификатов
│   └── itam.db         # База данных (создаётся автоматически)
├── src/                # Frontend
│   ├── api.ts          # API клиент
│   ├── context/
│   │   ├── AuthContext.tsx    # Авторизация
│   │   └── DataContext.tsx    # Данные
│   ├── pages/
│   │   ├── Login.tsx         # Страница входа
│   │   ├── Dashboard.tsx
│   │   ├── Equipment.tsx
│   │   ├── EquipmentForm.tsx
│   │   ├── EquipmentView.tsx
│   │   ├── Categories.tsx
│   │   ├── Users.tsx
│   │   ├── Rooms.tsx
│   │   ├── QRGenerator.tsx
│   │   ├── QRScan.tsx
│   │   ├── Certificates.tsx  # Управление сертификатами
│   │   └── AuthUsers.tsx     # Управление пользователями
│   └── components/
│       └── Layout.tsx
└── package.json
```

## 🔌 API Endpoints

### Авторизация
- `POST /api/auth/login` - вход (публичный)
- `GET /api/auth/me` - текущий пользователь
- `POST /api/auth/logout` - выход
- `POST /api/auth/change-password` - смена пароля
- `GET /api/auth/users` - список пользователей (admin)
- `POST /api/auth/users` - создать пользователя (admin)
- `PUT /api/auth/users/:id` - обновить (admin)
- `DELETE /api/auth/users/:id` - удалить (admin)
- `GET /api/auth/logs` - журнал входов (admin)

### SSL Сертификаты (admin)
- `GET /api/certificates` - список
- `POST /api/certificates` - загрузить (multipart)
- `POST /api/certificates/generate-self-signed` - создать самоподписанный
- `POST /api/certificates/:id/activate` - активировать
- `POST /api/certificates/:id/deactivate` - деактивировать
- `DELETE /api/certificates/:id` - удалить

### Оборудование
- `GET /api/equipment` - список
- `GET /api/equipment/:id` - детали
- `GET /api/equipment/qr/:code` - поиск по QR
- `POST /api/equipment` - создать
- `PUT /api/equipment/:id` - обновить
- `PATCH /api/equipment/:id/status` - сменить статус
- `PATCH /api/equipment/:id/move` - переместить
- `DELETE /api/equipment/:id` - удалить

### Остальные ресурсы
- `/api/categories` - категории
- `/api/types` - типы
- `/api/users` - сотрудники
- `/api/rooms` - помещения
- `/api/stats` - статистика

## 🔐 Безопасность

### Рекомендации для продакшн:
1. ✅ Смените пароль администратора
2. ✅ Используйте HTTPS с валидным сертификатом
3. ✅ Настройте `JWT_SECRET` в переменных окружения
4. ✅ Ограничьте доступ по IP через firewall
5. ✅ Настройте резервное копирование БД
6. ✅ Используйте Nginx reverse proxy
7. ✅ Включите rate limiting
8. ✅ Настройте CORS для вашего домена

### Переменные окружения:
```bash
PORT=3001                    # HTTP порт
HTTPS_PORT=3443              # HTTPS порт
JWT_SECRET=your-secret-key   # Секрет для JWT
```

## 📊 База данных

SQLite база данных создаётся автоматически в `server/itam.db`.

### Таблицы:
- `auth_users` - пользователи авторизации
- `sessions` - активные сессии
- `auth_logs` - журнал авторизации
- `ssl_certificates` - SSL сертификаты
- `categories` - категории оборудования
- `equipment_types` - типы оборудования
- `users` - сотрудники
- `rooms` - помещения
- `equipment` - оборудование
- `maintenance_logs` - журнал обслуживания
- `move_logs` - журнал перемещений
- `status_logs` - журнал изменений статусов

### Резервное копирование:
```bash
# Создайте копию БД
cp server/itam.db server/itam.backup.db

# Автоматическое копирование (cron)
0 2 * * * cp /path/to/server/itam.db /path/to/backups/itam-$(date +\%Y\%m\%d).db
```

## 📝 Статусы оборудования

- `in_use` - В эксплуатации
- `in_reserve` - В резерве
- `written_off` - Списан
- `in_repair` - В ремонте

## 🐛 Решение проблем

### Ошибка "Не удалось подключиться к API"
- Проверьте, что сервер запущен: `cd server && npm start`
- Убедитесь, что порт 3001 не занят
- Проверьте CORS настройки в `src/api.ts`

### Камера не работает для QR-сканера
- Камера работает только по HTTPS или localhost
- Используйте ngrok для тестирования: `ngrok http 3001`
- Проверьте разрешения браузера

### Сертификат не применяется
- Перезапустите сервер после активации
- Проверьте, что файлы сертификата существуют
- Проверьте логи сервера

## 📄 Лицензия

MIT

## 👨‍💻 Разработка

```bash
# Режим разработки (горячая перезагрузка)
# Терминал 1 - сервер
cd server && npm run dev

# Терминал 2 - фронтенд
npm run dev
```

---

**Версия:** 2.0  
**Дата:** 2024  
**Автор:** ITAM Service Team

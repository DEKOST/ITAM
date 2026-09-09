const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const path = require('path');
const { db, initDatabase, seedDemoData } = require('./db');
const { authMiddleware } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimit');
const { getActiveCertificate } = require('./routes/certificates');
const backupService = require('./services/backup');

const app = express();
const HTTP_PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Доверяем proxy (Apache/Nginx) для получения реальных IP клиентов
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter); // Глобальный rate limiter

// Инициализация БД
initDatabase();
seedDemoData();

// Запуск автоматических бэкапов
backupService.startScheduledBackups();

// Очистка просроченных сессий при старте
const cleanupExpiredSessions = () => {
  try {
    const result = db.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run();
    if (result.changes > 0) {
      console.log(`🧹 Очищено просроченных сессий: ${result.changes}`);
    }
  } catch (error) {
    console.error('Ошибка очистки сессий:', error.message);
  }
};

// Очистка старых логов авторизации (старше 90 дней)
const cleanupOldAuthLogs = () => {
  try {
    const result = db.prepare('DELETE FROM auth_logs WHERE created_at < datetime("now", "-90 days")').run();
    if (result.changes > 0) {
      console.log(`🧹 Очищено старых записей журнала: ${result.changes}`);
    }
  } catch (error) {
    console.error('Ошибка очистки логов:', error.message);
  }
};

// Очистка при старте
cleanupExpiredSessions();
cleanupOldAuthLogs();

// Периодическая очистка каждые 6 часов
setInterval(() => {
  cleanupExpiredSessions();
  cleanupOldAuthLogs();
}, 6 * 60 * 60 * 1000);

// Публичные роуты (без авторизации)
app.use('/api/auth', require('./routes/auth'));

// Защищённые роуты (требуют авторизации)
app.use('/api/equipment', authMiddleware, require('./routes/equipment'));
app.use('/api/categories', authMiddleware, require('./routes/categories'));
app.use('/api/types', authMiddleware, require('./routes/types'));
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/rooms', authMiddleware, require('./routes/rooms'));
app.use('/api/subdivisions', authMiddleware, require('./routes/subdivisions'));
app.use('/api/maintenance-types', authMiddleware, require('./routes/maintenanceTypes'));
app.use('/api', authMiddleware, require('./routes/maintenance'));
app.use('/api/certificates', authMiddleware, require('./routes/certificates'));
app.use('/api/backups', authMiddleware, require('./routes/backups'));
app.use('/api', authMiddleware, require('./routes/history'));

// Статистика
app.get('/api/stats', authMiddleware, (req, res) => {
  const totalEquipment = db.prepare('SELECT COUNT(*) as count FROM equipment').get();
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
  const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM equipment GROUP BY status').all();
  const byType = db.prepare(`
    SELECT et.name, COUNT(*) as count 
    FROM equipment e 
    JOIN equipment_types et ON e.type_id = et.id 
    GROUP BY et.name
    ORDER BY count DESC
    LIMIT 5
  `).all();
  
  const recentEquipment = db.prepare(`
    SELECT e.*, et.name as type_name
    FROM equipment e
    LEFT JOIN equipment_types et ON e.type_id = et.id
    ORDER BY e.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    total: {
      equipment: totalEquipment.count,
      users: totalUsers.count,
      rooms: totalRooms.count,
      categories: totalCategories.count
    },
    byStatus,
    byType,
    recentEquipment
  });
});

// Проверка статуса сервера (публичный)
app.get('/api/health', (req, res) => {
  const activeCert = db.prepare('SELECT * FROM ssl_certificates WHERE is_active = 1').get();
  res.json({ 
    status: 'ok', 
    https: !!activeCert,
    domain: activeCert ? activeCert.domain : null,
    timestamp: new Date().toISOString()
  });
});

// Раздача статики фронтенда
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback - все остальные запросы отдают index.html
app.get('*', (req, res) => {
  // Не отдаём index.html для API запросов
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск HTTP сервера
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🖥️  ITAM Service Server запущен!                       ║
║                                                           ║
║   📡 HTTP:  http://localhost:${HTTP_PORT}                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Запуск HTTPS сервера если есть активный сертификат
function startHttpsServer() {
  const certOptions = getActiveCertificate();
  if (certOptions) {
    const httpsServer = https.createServer(certOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
      const activeCert = db.prepare('SELECT domain FROM ssl_certificates WHERE is_active = 1').get();
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔒 HTTPS сервер запущен!                               ║
║                                                           ║
║   📡 HTTPS: https://localhost:${HTTPS_PORT}                 ║
║   🌐 Домен: https://${activeCert?.domain || 'domain.ru'}            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
    return httpsServer;
  }
  return null;
}

// Пробуем запустить HTTPS при старте
let httpsServer = startHttpsServer();

// Экспортируем для возможности перезапуска HTTPS
module.exports = { app, httpServer, httpsServer, startHttpsServer };

const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase, seedDemoData } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация БД
initDatabase();
seedDemoData();

// API Routes
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/types', require('./routes/types'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));

// Статистика
app.get('/api/stats', (req, res) => {
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

// Раздача статики фронтенда
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🖥️  ITAM Service Server запущен!                       ║
║                                                           ║
║   📡 API:      http://localhost:${PORT}/api                ║
║   🌐 Frontend: http://localhost:${PORT}                    ║
║                                                           ║
║   Для разработки фронтенда:                               ║
║   npm run dev (порт 5173)                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

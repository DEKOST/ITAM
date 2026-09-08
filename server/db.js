const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'itam.db');
const db = new Database(DB_PATH);

// Включаем WAL режим для лучшей производительности
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Инициализация схемы БД
function initDatabase() {
  db.exec(`
    -- Типы обслуживания
    CREATE TABLE IF NOT EXISTS maintenance_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      interval_days INTEGER DEFAULT 0,
      interval_months INTEGER DEFAULT 0,
      interval_years INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Журнал обслуживания (расширенный)
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      maintenance_type_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      cost REAL DEFAULT 0,
      performed_by TEXT DEFAULT '',
      next_maintenance_date TEXT,
      notes TEXT DEFAULT '',
      changed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
      FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id),
      FOREIGN KEY (changed_by) REFERENCES auth_users(id) ON DELETE SET NULL
    );

    -- Индексы для быстрого поиска
    CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equipment ON maintenance_logs(equipment_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_logs_type ON maintenance_logs(maintenance_type_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON maintenance_logs(date);
  `);

  // Миграция: добавляем колонку changed_by в maintenance_logs если её нет
  try {
    const columns = db.prepare("PRAGMA table_info(maintenance_logs)").all();
    const hasChangedByColumn = columns.some(col => col.name === 'changed_by');
    if (!hasChangedByColumn) {
      db.exec('ALTER TABLE maintenance_logs ADD COLUMN changed_by TEXT');
    }
    
    // Добавляем maintenance_type_id если нет
    const hasTypeId = columns.some(col => col.name === 'maintenance_type_id');
    if (!hasTypeId) {
      db.exec('ALTER TABLE maintenance_logs ADD COLUMN maintenance_type_id TEXT');
      db.exec('ALTER TABLE maintenance_logs ADD COLUMN next_maintenance_date TEXT');
    }
  } catch (e) {
    // Игнорируем ошибки миграции
  }
}

// Инициализация начальных данных
function seedDemoData() {
  const bcrypt = require('bcryptjs');
  
  // Создание администратора по умолчанию
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM auth_users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    const { v4: uuidv4 } = require('uuid');
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO auth_users (id, username, password_hash, full_name, email, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'admin', passwordHash, 'Администратор системы', 'admin@domain.ru', 'admin');
    console.log('✅ Администратор создан: admin / admin123');
  }

  // Создаем типы обслуживания если их нет
  const maintenanceTypesCount = db.prepare('SELECT COUNT(*) as count FROM maintenance_types').get();
  if (maintenanceTypesCount.count === 0) {
    const { v4: uuidv4 } = require('uuid');
    
    const maintenanceTypes = [
      { id: uuidv4(), name: 'Замена АКБ', description: 'Замена аккумуляторных батарей', interval_years: 3 },
      { id: uuidv4(), name: 'Чистка от пыли', description: 'Чистка оборудования от пыли', interval_months: 6 },
      { id: uuidv4(), name: 'Профилактика', description: 'Плановое техническое обслуживание', interval_months: 12 },
      { id: uuidv4(), name: 'Замена картриджа', description: 'Замена картриджа в принтере', interval_months: 3 },
      { id: uuidv4(), name: 'Обновление ПО', description: 'Обновление программного обеспечения', interval_months: 1 },
    ];

    const insertType = db.prepare('INSERT INTO maintenance_types (id, name, description, interval_days, interval_months, interval_years) VALUES (?, ?, ?, ?, ?, ?)');
    for (const type of maintenanceTypes) {
      insertType.run(type.id, type.name, type.description, type.interval_days || 0, type.interval_months || 0, type.interval_years || 0);
    }
    
    console.log('✅ Типы обслуживания созданы');
  }
}

module.exports = { db, initDatabase, seedDemoData };

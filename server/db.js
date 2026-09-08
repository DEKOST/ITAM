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
    -- Пользователи авторизации
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      webauthn_challenge TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- SSL/TLS сертификаты
    CREATE TABLE IF NOT EXISTS ssl_certificates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      cert_path TEXT NOT NULL,
      key_path TEXT NOT NULL,
      ca_path TEXT,
      issuer TEXT DEFAULT '',
      valid_from DATETIME,
      valid_to DATETIME,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Сессии
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    );

    -- Журнал авторизации
    CREATE TABLE IF NOT EXISTS auth_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Журнал входов
    CREATE TABLE IF NOT EXISTS login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    );

    -- WebAuthn credentials
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      credential_id TEXT NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER DEFAULT 0,
      device_type TEXT DEFAULT 'unknown',
      device_name TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used DATETIME,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    );

    -- Категории оборудования
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Типы оборудования
    CREATE TABLE IF NOT EXISTS equipment_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    -- Подразделения
    CREATE TABLE IF NOT EXISTS subdivisions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES subdivisions(id) ON DELETE SET NULL
    );

    -- Сотрудники
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      middle_name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      subdivision_id TEXT,
      position TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subdivision_id) REFERENCES subdivisions(id) ON DELETE SET NULL
    );

    -- Помещения
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      building TEXT NOT NULL DEFAULT '',
      floor INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Оборудование
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      serial_number TEXT DEFAULT '',
      inventory_number TEXT DEFAULT '',
      type_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_use',
      user_id TEXT,
      room_id TEXT,
      purchase_date TEXT DEFAULT '',
      warranty_end TEXT DEFAULT '',
      last_maintenance_date TEXT DEFAULT '',
      next_maintenance_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      qr_code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (type_id) REFERENCES equipment_types(id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
    );

    -- Журнал обслуживания
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'maintenance',
      description TEXT DEFAULT '',
      cost REAL DEFAULT 0,
      performed_by TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    -- Журнал перемещений
    CREATE TABLE IF NOT EXISTS move_logs (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      from_user_id TEXT,
      to_user_id TEXT,
      from_room_id TEXT,
      to_room_id TEXT,
      comment TEXT DEFAULT '',
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    -- Журнал изменений статуса
    CREATE TABLE IF NOT EXISTS status_logs (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      from_status TEXT,
      to_status TEXT NOT NULL,
      comment TEXT DEFAULT '',
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    -- Журнал изменений названия
    CREATE TABLE IF NOT EXISTS name_logs (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      from_name TEXT,
      to_name TEXT NOT NULL,
      comment TEXT DEFAULT '',
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    -- Универсальный журнал изменений полей оборудования
    CREATE TABLE IF NOT EXISTS equipment_field_changes (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES auth_users(id) ON DELETE SET NULL
    );

    -- Индексы для быстрого поиска
    CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_user ON equipment(user_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_room ON equipment(room_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
    CREATE INDEX IF NOT EXISTS idx_equipment_qr ON equipment(qr_code);
    CREATE INDEX IF NOT EXISTS idx_equipment_inventory ON equipment(inventory_number);
    CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number);
  `);

  // Миграция: добавляем колонку webauthn_challenge если её нет (для существующих БД)
  try {
    const columns = db.prepare("PRAGMA table_info(auth_users)").all();
    const hasWebAuthnColumn = columns.some(col => col.name === 'webauthn_challenge');
    if (!hasWebAuthnColumn) {
      db.exec('ALTER TABLE auth_users ADD COLUMN webauthn_challenge TEXT');
    }
  } catch (e) {
    // Игнорируем ошибки миграции
  }

  // Миграция: добавляем колонку middle_name в таблицу users если её нет
  try {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasMiddleNameColumn = columns.some(col => col.name === 'middle_name');
    if (!hasMiddleNameColumn) {
      db.exec('ALTER TABLE users ADD COLUMN middle_name TEXT DEFAULT ""');
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
}

module.exports = { db, initDatabase, seedDemoData };

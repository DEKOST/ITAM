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

    -- Сотрудники
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT DEFAULT '',
      department TEXT DEFAULT '',
      position TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    -- Индексы для быстрого поиска
    CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_user ON equipment(user_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_room ON equipment(room_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
    CREATE INDEX IF NOT EXISTS idx_equipment_qr ON equipment(qr_code);
    CREATE INDEX IF NOT EXISTS idx_equipment_inventory ON equipment(inventory_number);
    CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number);
  `);
}

// Заполнение демо-данными
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

  const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoriesCount.count > 0) return;

  const { v4: uuidv4 } = require('uuid');

  // Категории
  const categories = [
    { id: 'cat-1', name: 'Компьютеры', description: 'Настольные компьютеры и ноутбуки' },
    { id: 'cat-2', name: 'Периферия', description: 'Мониторы, клавиатуры, мыши' },
    { id: 'cat-3', name: 'Сетевое оборудование', description: 'Роутеры, свитчи, точки доступа' },
    { id: 'cat-4', name: 'Оргтехника', description: 'Принтеры, сканеры, МФУ' },
  ];

  const insertCategory = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
  for (const cat of categories) {
    insertCategory.run(cat.id, cat.name, cat.description);
  }

  // Типы
  const types = [
    { id: 'type-1', name: 'Ноутбук', category_id: 'cat-1' },
    { id: 'type-2', name: 'Настольный ПК', category_id: 'cat-1' },
    { id: 'type-3', name: 'Монитор', category_id: 'cat-2' },
    { id: 'type-4', name: 'Клавиатура', category_id: 'cat-2' },
    { id: 'type-5', name: 'Роутер', category_id: 'cat-3' },
    { id: 'type-6', name: 'Принтер', category_id: 'cat-4' },
  ];

  const insertType = db.prepare('INSERT INTO equipment_types (id, name, category_id) VALUES (?, ?, ?)');
  for (const type of types) {
    insertType.run(type.id, type.name, type.category_id);
  }

  // Сотрудники
  const users = [
    { id: 'user-1', first_name: 'Иван', last_name: 'Петров', email: 'petrov@company.ru', department: 'IT отдел', position: 'Системный администратор' },
    { id: 'user-2', first_name: 'Мария', last_name: 'Сидорова', email: 'sidorova@company.ru', department: 'Бухгалтерия', position: 'Главный бухгалтер' },
    { id: 'user-3', first_name: 'Алексей', last_name: 'Козлов', email: 'kozlov@company.ru', department: 'Отдел разработки', position: 'Разработчик' },
    { id: 'user-4', first_name: 'Елена', last_name: 'Волкова', email: 'volkova@company.ru', department: 'HR', position: 'HR менеджер' },
  ];

  const insertUser = db.prepare('INSERT INTO users (id, first_name, last_name, email, department, position) VALUES (?, ?, ?, ?, ?, ?)');
  for (const user of users) {
    insertUser.run(user.id, user.first_name, user.last_name, user.email, user.department, user.position);
  }

  // Помещения
  const rooms = [
    { id: 'room-1', name: 'Серверная', building: 'Главный корпус', floor: 1, description: 'Основная серверная комната' },
    { id: 'room-2', name: 'Кабинет 201', building: 'Главный корпус', floor: 2, description: 'Отдел разработки' },
    { id: 'room-3', name: 'Кабинет 305', building: 'Главный корпус', floor: 3, description: 'Бухгалтерия' },
    { id: 'room-4', name: 'Склад', building: 'Главный корпус', floor: 0, description: 'Склад оборудования' },
    { id: 'room-5', name: 'Кабинет 102', building: 'Главный корпус', floor: 1, description: 'HR отдел' },
  ];

  const insertRoom = db.prepare('INSERT INTO rooms (id, name, building, floor, description) VALUES (?, ?, ?, ?, ?)');
  for (const room of rooms) {
    insertRoom.run(room.id, room.name, room.building, room.floor, room.description);
  }

  // Оборудование
  const equipmentList = [
    { id: 'eq-1', name: 'ThinkPad X1 Carbon', serial_number: 'SN-2024-001', inventory_number: 'INV-001', type_id: 'type-1', status: 'in_use', user_id: 'user-3', room_id: 'room-2', purchase_date: '2024-01-15', warranty_end: '2027-01-15', last_maintenance_date: '2024-06-01', next_maintenance_date: '2025-06-01', notes: 'Корпоративный ноутбук', qr_code: 'eq-1' },
    { id: 'eq-2', name: 'Dell UltraSharp 27', serial_number: 'SN-2024-002', inventory_number: 'INV-002', type_id: 'type-3', status: 'in_use', user_id: 'user-3', room_id: 'room-2', purchase_date: '2024-02-10', warranty_end: '2027-02-10', notes: '', qr_code: 'eq-2' },
    { id: 'eq-3', name: 'HP LaserJet Pro', serial_number: 'SN-2023-015', inventory_number: 'INV-003', type_id: 'type-6', status: 'in_repair', user_id: null, room_id: 'room-3', purchase_date: '2023-03-20', warranty_end: '2025-03-20', last_maintenance_date: '2024-11-01', next_maintenance_date: '2025-05-01', notes: 'Замена картриджа', qr_code: 'eq-3' },
    { id: 'eq-4', name: 'MacBook Pro 14', serial_number: 'SN-2024-010', inventory_number: 'INV-004', type_id: 'type-1', status: 'in_reserve', user_id: null, room_id: 'room-4', purchase_date: '2024-03-01', warranty_end: '2027-03-01', notes: 'Резервный ноутбук', qr_code: 'eq-4' },
    { id: 'eq-5', name: 'Cisco Catalyst 2960', serial_number: 'SN-2022-100', inventory_number: 'INV-005', type_id: 'type-5', status: 'in_use', user_id: 'user-1', room_id: 'room-1', purchase_date: '2022-06-15', warranty_end: '2025-06-15', notes: 'Коммутатор серверной', qr_code: 'eq-5' },
  ];

  const insertEquipment = db.prepare(`INSERT INTO equipment (id, name, serial_number, inventory_number, type_id, status, user_id, room_id, purchase_date, warranty_end, last_maintenance_date, next_maintenance_date, notes, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const eq of equipmentList) {
    insertEquipment.run(eq.id, eq.name, eq.serial_number, eq.inventory_number, eq.type_id, eq.status, eq.user_id, eq.room_id, eq.purchase_date, eq.warranty_end, eq.last_maintenance_date, eq.next_maintenance_date, eq.notes, eq.qr_code);
  }

  console.log('✅ Демо-данные загружены');
}

module.exports = { db, initDatabase, seedDemoData };

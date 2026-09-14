const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Настройка multer для загрузки Excel файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel' // xls
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла. Разрешены только XLS и XLSX'));
    }
  }
});

// Все маршруты требуют авторизации и прав администратора
router.use(authMiddleware);
router.use(adminMiddleware);

// Получить шаблон для импорта сотрудников
router.get('/template/users', (req, res) => {
  const wb = XLSX.utils.book_new();
  
  // Создаём лист с данными
  const wsData = [
    ['Фамилия', 'Имя', 'Отчество', 'Email', 'Подразделение', 'Должность'],
    ['Иванов', 'Иван', 'Иванович', 'ivanov@company.ru', 'IT отдел', 'Системный администратор'],
    ['Петрова', 'Мария', 'Петровна', 'petrova@company.ru', 'Бухгалтерия', 'Бухгалтер']
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Устанавливаем ширину колонок
  ws['!cols'] = [
    { wch: 20 }, // Фамилия
    { wch: 15 }, // Имя
    { wch: 20 }, // Отчество
    { wch: 30 }, // Email
    { wch: 25 }, // Подразделение
    { wch: 30 }  // Должность
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
  
  // Создаём лист с инструкцией
  const instructionData = [
    ['Инструкция по импорту сотрудников'],
    [''],
    ['1. Заполните данные в листе "Сотрудники"'],
    ['2. Обязательные поля: Фамилия, Имя'],
    ['3. Подразделение - если не существует, будет создано автоматически'],
    ['4. Email должен быть в корректном формате'],
    ['5. Сохраните файл в формате XLS или XLSX'],
    ['6. Загрузите файл через форму импорта']
  ];
  
  const wsInstruction = XLSX.utils.aoa_to_sheet(instructionData);
  wsInstruction['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstruction, 'Инструкция');
  
  // Генерируем файл
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename=template_users.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// Получить шаблон для импорта оборудования
router.get('/template/equipment', (req, res) => {
  const wb = XLSX.utils.book_new();
  
  // Создаём лист с данными
  const wsData = [
    ['Название', 'Серийный номер', 'Инвентарный номер', 'Тип', 'Категория', 'Статус', 'Сотрудник (ФИО)', 'Помещение', 'Дата покупки', 'Гарантия до', 'Процессор', 'ОЗУ (ГБ)', 'Тип хранилища', 'Объём хранилища (ГБ)', 'Заметки'],
    ['Ноутбук Dell XPS 13', 'SN123456', 'INV-001', 'Ноутбук', 'Компьютеры', 'В эксплуатации', 'Иванов Иван Иванович', 'Кабинет 201', '2024-01-15', '2027-01-15', 'Intel Core i5-12400', '16', 'SSD', '512', 'Корпоративный ноутбук'],
    ['Монитор LG 27"', 'SN789012', 'INV-002', 'Монитор', 'Периферия', 'В резерве', '', 'Склад', '2024-02-10', '2027-02-10', '', '', '', '', '']
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Устанавливаем ширину колонок
  ws['!cols'] = [
    { wch: 25 }, // Название
    { wch: 20 }, // Серийный номер
    { wch: 20 }, // Инвентарный номер
    { wch: 20 }, // Тип
    { wch: 20 }, // Категория
    { wch: 20 }, // Статус
    { wch: 30 }, // Сотрудник
    { wch: 20 }, // Помещение
    { wch: 15 }, // Дата покупки
    { wch: 15 }, // Гарантия до
    { wch: 25 }, // Процессор
    { wch: 10 }, // ОЗУ
    { wch: 15 }, // Тип хранилища
    { wch: 20 }, // Объём хранилища
    { wch: 40 }  // Заметки
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Оборудование');
  
  // Создаём лист с инструкцией
  const instructionData = [
    ['Инструкция по импорту оборудования'],
    [''],
    ['1. Заполните данные в листе "Оборудование"'],
    ['2. Обязательные поля: Название, Тип, Категория, Статус'],
    ['3. Статус может быть: В эксплуатации, В резерве, Списан, В ремонте'],
    ['4. Сотрудник указывается в формате "Фамилия Имя Отчество"'],
    ['5. Если сотрудник/помещение не существует, поле останется пустым'],
    ['6. Даты в формате YYYY-MM-DD (например: 2024-01-15)'],
    ['7. Тип хранилища: SSD, HDD или M2'],
    ['8. Сохраните файл в формате XLS или XLSX'],
    ['9. Загрузите файл через форму импорта']
  ];
  
  const wsInstruction = XLSX.utils.aoa_to_sheet(instructionData);
  wsInstruction['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstruction, 'Инструкция');
  
  // Генерируем файл
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename=template_equipment.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// Импорт сотрудников
router.post('/users', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }

    // Читаем Excel файл
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ error: 'Файл пустой или содержит только заголовки' });
    }

    // Пропускаем заголовок
    const rows = data.slice(1);
    
    const results = {
      success: 0,
      errors: [],
      duplicates: [],
      createdSubdivisions: [],
      createdUsers: []
    };

    // Транзакция для импорта
    db.transaction(() => {
      rows.forEach((row, index) => {
        try {
          const [lastName, firstName, middleName, email, subdivisionName, position] = row;

          // Проверка обязательных полей
          if (!lastName || !firstName) {
            results.errors.push({
              row: index + 2,
              error: 'Не указаны обязательные поля: Фамилия, Имя',
              data: row
            });
            return;
          }

          // Проверка email
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            results.errors.push({
              row: index + 2,
              error: 'Некорректный формат email',
              data: row
            });
            return;
          }

          // Проверка на дубликаты
          const normalizedLastName = String(lastName).trim().toLowerCase();
          const normalizedFirstName = String(firstName).trim().toLowerCase();
          const normalizedMiddleName = middleName ? String(middleName).trim().toLowerCase() : '';
          const normalizedEmail = email ? String(email).trim().toLowerCase() : '';

          // Проверяем по ФИО
          const duplicateByName = db.prepare(`
            SELECT id, first_name, last_name, middle_name, email 
            FROM users 
            WHERE LOWER(last_name) = ? 
              AND LOWER(first_name) = ? 
              AND (LOWER(middle_name) = ? OR (LOWER(middle_name) = '' AND ? = ''))
          `).get(normalizedLastName, normalizedFirstName, normalizedMiddleName, normalizedMiddleName);

          if (duplicateByName) {
            results.duplicates.push({
              row: index + 2,
              reason: 'Сотрудник с таким ФИО уже существует',
              existingId: duplicateByName.id,
              existingName: `${duplicateByName.last_name} ${duplicateByName.first_name} ${duplicateByName.middle_name || ''}`.trim(),
              data: row
            });
            return;
          }

          // Проверяем по email (если указан)
          if (normalizedEmail) {
            const duplicateByEmail = db.prepare(`
              SELECT id, first_name, last_name, middle_name, email 
              FROM users 
              WHERE LOWER(email) = ?
            `).get(normalizedEmail);

            if (duplicateByEmail) {
              results.duplicates.push({
                row: index + 2,
                reason: 'Сотрудник с таким email уже существует',
                existingId: duplicateByEmail.id,
                existingName: `${duplicateByEmail.last_name} ${duplicateByEmail.first_name} ${duplicateByEmail.middle_name || ''}`.trim(),
                data: row
              });
              return;
            }
          }

          // Создаём или находим подразделение
          let subdivisionId = null;
          if (subdivisionName && String(subdivisionName).trim()) {
            const existingSubdivision = db.prepare('SELECT id FROM subdivisions WHERE name = ?').get(String(subdivisionName).trim());
            
            if (existingSubdivision) {
              subdivisionId = existingSubdivision.id;
            } else {
              // Создаём новое подразделение
              subdivisionId = uuidv4();
              db.prepare('INSERT INTO subdivisions (id, name, description, parent_id) VALUES (?, ?, ?, ?)').run(
                subdivisionId,
                String(subdivisionName).trim(),
                '',
                null
              );
              results.createdSubdivisions.push(String(subdivisionName).trim());
            }
          }

          // Создаём сотрудника
          const userId = uuidv4();
          db.prepare(`
            INSERT INTO users (id, first_name, last_name, middle_name, email, subdivision_id, position)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            userId,
            String(firstName).trim(),
            String(lastName).trim(),
            middleName ? String(middleName).trim() : '',
            email ? String(email).trim() : '',
            subdivisionId,
            position ? String(position).trim() : ''
          );

          results.createdUsers.push(`${lastName} ${firstName}`);
          results.success++;

        } catch (error) {
          results.errors.push({
            row: index + 2,
            error: error.message,
            data: row
          });
        }
      });
    })();

    res.json({
      message: `Импорт завершён. Успешно: ${results.success}, Дубликатов: ${results.duplicates.length}, Ошибок: ${results.errors.length}`,
      results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Импорт оборудования
router.post('/equipment', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }

    // Читаем Excel файл
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ error: 'Файл пустой или содержит только заголовки' });
    }

    // Пропускаем заголовок
    const rows = data.slice(1);
    
    const results = {
      success: 0,
      errors: [],
      duplicates: [],
      createdEquipment: []
    };

    // Маппинг статусов
    const statusMap = {
      'В эксплуатации': 'in_use',
      'В резерве': 'in_reserve',
      'Списан': 'written_off',
      'В ремонте': 'in_repair'
    };

    // Транзакция для импорта
    db.transaction(() => {
      rows.forEach((row, index) => {
        try {
          const [name, serialNumber, inventoryNumber, typeName, categoryName, status, employeeName, roomName, purchaseDate, warrantyEnd, cpu, ram, storageType, storageSize, notes] = row;

          // Проверка обязательных полей
          if (!name || !typeName || !categoryName || !status) {
            results.errors.push({
              row: index + 2,
              error: 'Не указаны обязательные поля: Название, Тип, Категория, Статус',
              data: row
            });
            return;
          }

          // Находим тип оборудования
          const equipmentType = db.prepare(`
            SELECT et.id FROM equipment_types et
            JOIN categories c ON et.category_id = c.id
            WHERE et.name = ? AND c.name = ?
          `).get(String(typeName).trim(), String(categoryName).trim());

          if (!equipmentType) {
            results.errors.push({
              row: index + 2,
              error: `Тип "${typeName}" в категории "${categoryName}" не найден`,
              data: row
            });
            return;
          }

          // Преобразуем статус
          const statusCode = statusMap[String(status).trim()];
          if (!statusCode) {
            results.errors.push({
              row: index + 2,
              error: `Некорректный статус: "${status}". Допустимые значения: В эксплуатации, В резерве, Списан, В ремонте`,
              data: row
            });
            return;
          }

          // Находим сотрудника по ФИО
          let userId = null;
          if (employeeName && String(employeeName).trim()) {
            const parts = String(employeeName).trim().split(/\s+/);
            if (parts.length >= 2) {
              const lastName = parts[0];
              const firstName = parts[1];
              const middleName = parts[2] || '';
              
              const user = db.prepare(`
                SELECT id FROM users 
                WHERE last_name = ? AND first_name = ? AND (middle_name = ? OR middle_name = '')
              `).get(lastName, firstName, middleName);
              
              if (user) {
                userId = user.id;
              }
            }
          }

          // Находим помещение
          let roomId = null;
          if (roomName && String(roomName).trim()) {
            const room = db.prepare('SELECT id FROM rooms WHERE name = ?').get(String(roomName).trim());
            if (room) {
              roomId = room.id;
            }
          }

          // Обрабатываем даты
          const parseDate = (dateValue) => {
            if (!dateValue) return '';
            if (typeof dateValue === 'string') {
              // Проверяем формат YYYY-MM-DD
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                return new Date(dateValue).toISOString();
              }
              // Пробуем распарсить как дату
              const date = new Date(dateValue);
              if (!isNaN(date.getTime())) {
                return date.toISOString();
              }
            }
            // Если это число (Excel serial date)
            if (typeof dateValue === 'number') {
              const date = XLSX.SSF.parse_date_code(dateValue);
              if (date) {
                return new Date(date.y, date.m - 1, date.d).toISOString();
              }
            }
            return '';
          };

          // Проверка на дубликаты
          const normalizedSerialNumber = serialNumber ? String(serialNumber).trim() : '';
          const normalizedInventoryNumber = inventoryNumber ? String(inventoryNumber).trim() : '';

          // Проверяем по инвентарному номеру (если указан)
          if (normalizedInventoryNumber) {
            const duplicateByInventory = db.prepare(`
              SELECT id, name, serial_number, inventory_number 
              FROM equipment 
              WHERE inventory_number = ?
            `).get(normalizedInventoryNumber);

            if (duplicateByInventory) {
              results.duplicates.push({
                row: index + 2,
                reason: `Оборудование с инвентарным номером "${normalizedInventoryNumber}" уже существует`,
                existingId: duplicateByInventory.id,
                existingName: duplicateByInventory.name,
                data: row
              });
              return;
            }
          }

          // Проверяем по серийному номеру (если указан)
          if (normalizedSerialNumber) {
            const duplicateBySerial = db.prepare(`
              SELECT id, name, serial_number, inventory_number 
              FROM equipment 
              WHERE serial_number = ? AND serial_number != ''
            `).get(normalizedSerialNumber);

            if (duplicateBySerial) {
              results.duplicates.push({
                row: index + 2,
                reason: `Оборудование с серийным номером "${normalizedSerialNumber}" уже существует`,
                existingId: duplicateBySerial.id,
                existingName: duplicateBySerial.name,
                data: row
              });
              return;
            }
          }

          // Создаём оборудование
          const equipmentId = uuidv4();
          db.prepare(`
            INSERT INTO equipment (
              id, name, serial_number, inventory_number, type_id, status, 
              user_id, room_id, purchase_date, warranty_end, 
              cpu, ram, storage_type, storage_size, notes, qr_code, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            equipmentId,
            String(name).trim(),
            serialNumber ? String(serialNumber).trim() : '',
            inventoryNumber ? String(inventoryNumber).trim() : `INV-${Date.now()}-${index}`,
            equipmentType.id,
            statusCode,
            userId,
            roomId,
            parseDate(purchaseDate),
            parseDate(warrantyEnd),
            cpu ? String(cpu).trim() : '',
            ram ? parseInt(ram) || 0 : 0,
            storageType ? String(storageType).trim().toUpperCase() : '',
            storageSize ? parseInt(storageSize) || 0 : 0,
            notes ? String(notes).trim() : '',
            equipmentId,
            new Date().toISOString()
          );

          results.createdEquipment.push(String(name).trim());
          results.success++;

        } catch (error) {
          results.errors.push({
            row: index + 2,
            error: error.message,
            data: row
          });
        }
      });
    })();

    res.json({
      message: `Импорт завершён. Успешно: ${results.success}, Дубликатов: ${results.duplicates.length}, Ошибок: ${results.errors.length}`,
      results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

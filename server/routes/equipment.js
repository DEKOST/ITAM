const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { writeLimiter } = require('../middleware/rateLimit');
const { equipmentSchema, changeStatusSchema, moveSchema, validate } = require('../middleware/validation');

// Получить всё оборудование с связями
router.get('/', (req, res) => {
  const { status, type_id, user_id, room_id, search } = req.query;

  let query = `
    SELECT 
      e.*,
      et.name as type_name,
      et.category_id,
      c.name as category_name,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      u.subdivision_id as user_subdivision_id,
      r.name as room_name,
      r.building as room_building
    FROM equipment e
    LEFT JOIN equipment_types et ON e.type_id = et.id
    LEFT JOIN categories c ON et.category_id = c.id
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN rooms r ON e.room_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }
  if (type_id) {
    query += ' AND e.type_id = ?';
    params.push(type_id);
  }
  if (user_id) {
    query += ' AND e.user_id = ?';
    params.push(user_id);
  }
  if (room_id) {
    query += ' AND e.room_id = ?';
    params.push(room_id);
  }
  if (search) {
    query += ' AND (e.name LIKE ? OR e.serial_number LIKE ? OR e.inventory_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY e.created_at DESC';

  const items = db.prepare(query).all(...params);
  res.json(items);
});

// Получить одно оборудование по ID
router.get('/:id', (req, res) => {
  const item = db.prepare(`
    SELECT 
      e.*,
      et.name as type_name,
      et.category_id,
      c.name as category_name,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      u.subdivision_id as user_subdivision_id,
      r.name as room_name,
      r.building as room_building,
      r.floor as room_floor
    FROM equipment e
    LEFT JOIN equipment_types et ON e.type_id = et.id
    LEFT JOIN categories c ON et.category_id = c.id
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN rooms r ON e.room_id = r.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!item) return res.status(404).json({ error: 'Оборудование не найдено' });

  // Получаем логи
  const statusLogs = db.prepare('SELECT * FROM status_logs WHERE equipment_id = ? ORDER BY date DESC').all(req.params.id);
  const moveLogs = db.prepare('SELECT * FROM move_logs WHERE equipment_id = ? ORDER BY date DESC').all(req.params.id);
  const maintenanceLogs = db.prepare('SELECT * FROM maintenance_logs WHERE equipment_id = ? ORDER BY date DESC').all(req.params.id);

  res.json({ ...item, statusLogs, moveLogs, maintenanceLogs });
});

// Найти по QR коду
router.get('/qr/:code', (req, res) => {
  const item = db.prepare(`
    SELECT 
      e.*,
      et.name as type_name,
      c.name as category_name,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      r.name as room_name
    FROM equipment e
    LEFT JOIN equipment_types et ON e.type_id = et.id
    LEFT JOIN categories c ON et.category_id = c.id
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN rooms r ON e.room_id = r.id
    WHERE e.qr_code = ?
  `).get(req.params.code);

  if (!item) return res.status(404).json({ error: 'Оборудование не найдено' });
  res.json(item);
});

// Создать оборудование
router.post('/', writeLimiter, validate(equipmentSchema), (req, res) => {
  const { name, serial_number, inventory_number, type_id, status, user_id, room_id, purchase_date, warranty_end, last_maintenance_date, next_maintenance_date, notes, cpu, ram, storage_type, storage_size } = req.body;

  // Проверка существования типа
  const typeExists = db.prepare('SELECT id FROM equipment_types WHERE id = ?').get(type_id);
  if (!typeExists) return res.status(400).json({ error: 'Тип оборудования не найден' });

  const id = uuidv4();
  const qr_code = id; // QR код = ID оборудования

  db.prepare(`
    INSERT INTO equipment (id, name, serial_number, inventory_number, type_id, status, user_id, room_id, purchase_date, warranty_end, last_maintenance_date, next_maintenance_date, notes, qr_code, cpu, ram, storage_type, storage_size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, serial_number || '', inventory_number || '', type_id, status || 'in_use', user_id || null, room_id || null, purchase_date || '', warranty_end || '', last_maintenance_date || '', next_maintenance_date || '', notes || '', qr_code, cpu || '', ram || 0, storage_type || '', storage_size || 0);

  const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
  res.status(201).json(item);
});

// Обновить оборудование
router.put('/:id', writeLimiter, validate(equipmentSchema), (req, res) => {
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Оборудование не найдено' });

  const { name, serial_number, inventory_number, type_id, status, user_id, room_id, purchase_date, warranty_end, last_maintenance_date, next_maintenance_date, notes, cpu, ram, storage_type, storage_size } = req.body;
  const changedBy = req.user ? req.user.id : null;

  // Если статус изменился - логируем
  if (status && status !== existing.status) {
    db.prepare('INSERT INTO status_logs (id, equipment_id, from_status, to_status) VALUES (?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.status, status);
  }

  // Если перемещение - логируем
  if ((user_id !== undefined && user_id !== existing.user_id) || (room_id !== undefined && room_id !== existing.room_id)) {
    db.prepare('INSERT INTO move_logs (id, equipment_id, from_user_id, to_user_id, from_room_id, to_room_id) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.user_id, user_id || null, existing.room_id, room_id || null);
  }

  // Логируем все изменения полей
  const fieldsToLog = [
    { field: 'name', oldValue: existing.name, newValue: name || existing.name },
    { field: 'serial_number', oldValue: existing.serial_number, newValue: serial_number !== undefined ? serial_number : existing.serial_number },
    { field: 'inventory_number', oldValue: existing.inventory_number, newValue: inventory_number !== undefined ? inventory_number : existing.inventory_number },
    { field: 'type_id', oldValue: existing.type_id, newValue: type_id || existing.type_id },
    { field: 'user_id', oldValue: existing.user_id, newValue: user_id !== undefined ? user_id : existing.user_id },
    { field: 'room_id', oldValue: existing.room_id, newValue: room_id !== undefined ? room_id : existing.room_id },
    { field: 'purchase_date', oldValue: existing.purchase_date, newValue: purchase_date !== undefined ? purchase_date : existing.purchase_date },
    { field: 'warranty_end', oldValue: existing.warranty_end, newValue: warranty_end !== undefined ? warranty_end : existing.warranty_end },
    { field: 'last_maintenance_date', oldValue: existing.last_maintenance_date, newValue: last_maintenance_date !== undefined ? last_maintenance_date : existing.last_maintenance_date },
    { field: 'next_maintenance_date', oldValue: existing.next_maintenance_date, newValue: next_maintenance_date !== undefined ? next_maintenance_date : existing.next_maintenance_date },
    { field: 'notes', oldValue: existing.notes, newValue: notes !== undefined ? notes : existing.notes }
  ];

  fieldsToLog.forEach(({ field, oldValue, newValue }) => {
    // Логируем только если значение действительно изменилось
    if (String(oldValue || '') !== String(newValue || '')) {
      db.prepare('INSERT INTO equipment_field_changes (id, equipment_id, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuidv4(),
        req.params.id,
        field,
        oldValue || null,
        newValue || null,
        changedBy
      );
    }
  });

  db.prepare(`
    UPDATE equipment SET 
      name = ?, serial_number = ?, inventory_number = ?, type_id = ?, status = ?, 
      user_id = ?, room_id = ?, purchase_date = ?, warranty_end = ?, 
      last_maintenance_date = ?, next_maintenance_date = ?, notes = ?,
      cpu = ?, ram = ?, storage_type = ?, storage_size = ?
    WHERE id = ?
  `).run(
    name || existing.name,
    serial_number !== undefined ? serial_number : existing.serial_number,
    inventory_number !== undefined ? inventory_number : existing.inventory_number,
    type_id || existing.type_id,
    status || existing.status,
    user_id !== undefined ? user_id : existing.user_id,
    room_id !== undefined ? room_id : existing.room_id,
    purchase_date !== undefined ? purchase_date : existing.purchase_date,
    warranty_end !== undefined ? warranty_end : existing.warranty_end,
    last_maintenance_date !== undefined ? last_maintenance_date : existing.last_maintenance_date,
    next_maintenance_date !== undefined ? next_maintenance_date : existing.next_maintenance_date,
    notes !== undefined ? notes : existing.notes,
    cpu !== undefined ? cpu : existing.cpu,
    ram !== undefined ? ram : existing.ram,
    storage_type !== undefined ? storage_type : existing.storage_type,
    storage_size !== undefined ? storage_size : existing.storage_size,
    req.params.id
  );

  const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json(item);
});

// Изменить статус
router.patch('/:id/status', writeLimiter, validate(changeStatusSchema), (req, res) => {
  const { status, comment } = req.body;
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Оборудование не найдено' });

  const changedBy = req.user ? req.user.id : null;

  db.prepare('UPDATE equipment SET status = ? WHERE id = ?').run(status, req.params.id);
  db.prepare('INSERT INTO status_logs (id, equipment_id, from_status, to_status, changed_by, comment) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.status, status, changedBy, comment || '');

  const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json(item);
});

// Переместить оборудование
router.patch('/:id/move', writeLimiter, validate(moveSchema), (req, res) => {
  const { user_id, room_id, comment } = req.body;
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Оборудование не найдено' });

  const changedBy = req.user ? req.user.id : null;

  db.prepare('UPDATE equipment SET user_id = ?, room_id = ? WHERE id = ?').run(user_id || null, room_id || null, req.params.id);
  db.prepare('INSERT INTO move_logs (id, equipment_id, from_user_id, to_user_id, from_room_id, to_room_id, changed_by, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.user_id, user_id || null, existing.room_id, room_id || null, changedBy, comment || '');

  const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json(item);
});

// Изменить название оборудования
router.patch('/:id/name', writeLimiter, (req, res) => {
  const { name, comment } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Название не может быть пустым' });
  }
  
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Оборудование не найдено' });

  // Если название не изменилось
  if (existing.name === name) {
    return res.json(existing);
  }

  const changedBy = req.user ? req.user.id : null;

  // Обновляем название
  db.prepare('UPDATE equipment SET name = ? WHERE id = ?').run(name, req.params.id);
  
  // Логируем изменение
  db.prepare('INSERT INTO name_logs (id, equipment_id, from_name, to_name, changed_by, comment) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(), 
    req.params.id, 
    existing.name, 
    name, 
    changedBy,
    comment || ''
  );

  const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json(item);
});

// Удалить оборудование
router.delete('/:id', writeLimiter, (req, res) => {
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Оборудование не найдено' });

  db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Статистика
router.get('/stats/summary', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM equipment').get();
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM equipment GROUP BY status').all();
  const byType = db.prepare(`
    SELECT et.name, COUNT(*) as count 
    FROM equipment e 
    JOIN equipment_types et ON e.type_id = et.id 
    GROUP BY et.name
  `).all();
  const byCategory = db.prepare(`
    SELECT c.name, COUNT(*) as count 
    FROM equipment e 
    JOIN equipment_types et ON e.type_id = et.id 
    JOIN categories c ON et.category_id = c.id 
    GROUP BY c.name
  `).all;

  res.json({
    total: total.count,
    byStatus,
    byType,
    byCategory: byCategory()
  });
});

module.exports = router;

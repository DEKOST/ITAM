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
  const { name, serial_number, inventory_number, type_id, status, user_id, room_id, purchase_date, warranty_end, last_maintenance_date, next_maintenance_date, notes } = req.body;

  // Проверка существования типа
  const typeExists = db.prepare('SELECT id FROM equipment_types WHERE id = ?').get(type_id);
  if (!typeExists) return res.status(400).json({ error: 'Тип оборудования не найден' });

  const id = uuidv4();
  const qr_code = id; // QR код = ID оборудования

  db.prepare(`
    INSERT INTO equipment (id, name, serial_number, inventory_number, type_id, status, user_id, room_id, purchase_date, warranty_end, last_maintenance_date, next_maintenance_date, notes, qr_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, serial_number || '', inventory_number || '', type_id, status || 'in_use', user_id || null, room_id || null, purchase_date || '', warranty_end || '', last_maintenance_date || '', next_maintenance_date || '', notes || '', qr_code);

  const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
  res.status(201).json(item);
});

// Обновить оборудование
router.put('/:id', writeLimiter, validate(equipmentSchema), (req, res) => {
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Оборудование не найдено' });

  const { name, serial_number, inventory_number, type_id, status, user_id, room_id, purchase_date, warranty_end, last_maintenance_date, next_maintenance_date, notes } = req.body;

  // Если статус изменился - логируем
  if (status && status !== existing.status) {
    db.prepare('INSERT INTO status_logs (id, equipment_id, from_status, to_status) VALUES (?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.status, status);
  }

  // Если перемещение - логируем
  if ((user_id !== undefined && user_id !== existing.user_id) || (room_id !== undefined && room_id !== existing.room_id)) {
    db.prepare('INSERT INTO move_logs (id, equipment_id, from_user_id, to_user_id, from_room_id, to_room_id) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.user_id, user_id || null, existing.room_id, room_id || null);
  }

  db.prepare(`
    UPDATE equipment SET 
      name = ?, serial_number = ?, inventory_number = ?, type_id = ?, status = ?, 
      user_id = ?, room_id = ?, purchase_date = ?, warranty_end = ?, 
      last_maintenance_date = ?, next_maintenance_date = ?, notes = ?
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

  db.prepare('UPDATE equipment SET status = ? WHERE id = ?').run(status, req.params.id);
  db.prepare('INSERT INTO status_logs (id, equipment_id, from_status, to_status, comment) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.status, status, comment || '');

  const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json(item);
});

// Переместить оборудование
router.patch('/:id/move', writeLimiter, validate(moveSchema), (req, res) => {
  const { user_id, room_id, comment } = req.body;
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Оборудование не найдено' });

  db.prepare('UPDATE equipment SET user_id = ?, room_id = ? WHERE id = ?').run(user_id || null, room_id || null, req.params.id);
  db.prepare('INSERT INTO move_logs (id, equipment_id, from_user_id, to_user_id, from_room_id, to_room_id, comment) VALUES (?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), req.params.id, existing.user_id, user_id || null, existing.room_id, room_id || null, comment || '');

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

  // Обновляем название
  db.prepare('UPDATE equipment SET name = ? WHERE id = ?').run(name, req.params.id);
  
  // Логируем изменение
  db.prepare('INSERT INTO name_logs (id, equipment_id, from_name, to_name, comment) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 
    req.params.id, 
    existing.name, 
    name, 
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

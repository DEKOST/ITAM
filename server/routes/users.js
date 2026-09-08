const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { writeLimiter } = require('../middleware/rateLimit');
const { userSchema, validate } = require('../middleware/validation');

router.get('/', (req, res) => {
  const items = db.prepare(`
    SELECT u.*, 
      (SELECT COUNT(*) FROM equipment WHERE user_id = u.id) as equipment_count
    FROM users u 
    ORDER BY u.last_name, u.first_name
  `).all();
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = db.prepare(`
    SELECT u.*, 
      (SELECT COUNT(*) FROM equipment WHERE user_id = u.id) as equipment_count
    FROM users u 
    WHERE u.id = ?
  `).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Сотрудник не найден' });
  
  // Получаем оборудование сотрудника
  const equipment = db.prepare(`
    SELECT e.*, et.name as type_name, r.name as room_name
    FROM equipment e
    LEFT JOIN equipment_types et ON e.type_id = et.id
    LEFT JOIN rooms r ON e.room_id = r.id
    WHERE e.user_id = ?
  `).all(req.params.id);
  
  res.json({ ...item, equipment });
});

router.post('/', writeLimiter, validate(userSchema), (req, res) => {
  const { first_name, last_name, email, subdivision_id, position } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, first_name, last_name, email, subdivision_id, position) VALUES (?, ?, ?, ?, ?, ?)').run(id, first_name, last_name, email || '', subdivision_id || null, position || '');
  const item = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.status(201).json(item);
});

router.put('/:id', writeLimiter, validate(userSchema), (req, res) => {
  const { first_name, last_name, email, subdivision_id, position } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Сотрудник не найден' });
  
  db.prepare('UPDATE users SET first_name = ?, last_name = ?, email = ?, subdivision_id = ?, position = ? WHERE id = ?').run(
    first_name || existing.first_name,
    last_name || existing.last_name,
    email !== undefined ? email : existing.email,
    subdivision_id !== undefined ? subdivision_id : existing.subdivision_id,
    position !== undefined ? position : existing.position,
    req.params.id
  );
  const item = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Сотрудник не найден' });
  
  // Снимаем привязку с оборудования
  db.prepare('UPDATE equipment SET user_id = NULL WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
